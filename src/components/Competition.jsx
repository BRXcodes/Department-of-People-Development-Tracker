import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './Competition.css'

// Metric definitions. rollup: how the team total is computed.
// higherBetter: which direction wins for the leader comparison.
// kind: 'money' | 'score' | 'count' — controls formatting + quick +1 buttons.
const METRICS = [
  { key: 'resi_ajs',       label: 'Resi AJs',       kind: 'money', rollup: 'avg', higherBetter: true },
  { key: 'revenue',        label: 'Revenue',        kind: 'money', rollup: 'sum', higherBetter: true },
  { key: 'nps',            label: 'NPS',            kind: 'score', rollup: 'avg', higherBetter: true,  steps: true, allowNegative: true },
  { key: 'google_reviews', label: 'Google Reviews', kind: 'count', rollup: 'sum', higherBetter: true,  steps: true },
  { key: 'cancels',        label: 'Cancels',        kind: 'count', rollup: 'sum', higherBetter: false, steps: true },
]

function formatValue(kind, value) {
  const n = Number(value) || 0
  if (kind === 'money') {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  }
  if (kind === 'score') {
    return Math.round(n * 10) / 10 // one decimal
  }
  return Math.round(n)
}

function teamTotal(members, metric) {
  if (members.length === 0) return 0
  const vals = members.map(m => Number(m[metric.key]) || 0)
  const sum = vals.reduce((a, b) => a + b, 0)
  return metric.rollup === 'avg' ? sum / members.length : sum
}

// Clean a leaderboard name: strip trailing digits and TTM/ttm suffixes.
function cleanName(raw) {
  return raw
    .replace(/\s*[Tt][Tt][Mm]\s*\d*$/,'') // "Brandon ErnestTTM", "FuentesTTM2"
    .replace(/\d+$/, '')                    // trailing digits like "Case2"
    .replace(/\s+/g, ' ')
    .trim()
}

const MONEY = (s) => Number(String(s).replace(/[^0-9.\-]/g, '')) || 0
const INT = (s) => parseInt(String(s).replace(/[^0-9\-]/g, ''), 10) || 0

/**
 * Parse pasted 1800GotJunk leaderboard text into people with metrics.
 * Each person is a repeating block of lines:
 *   rank / roleCode / Name / roleTitle / "jobs  $revenue" / "$AJs (%)" /
 *   loadRate% / googleReviews% (n) / thirdPct% / NPS "score (n)" or "-"
 * Duplicate names (same cleaned name) are merged: job_count/revenue/reviews
 * summed, resi_ajs/nps averaged (weighted by job_count where possible).
 */
function parseLeaderboard(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const people = []
  let i = 0
  while (i < lines.length) {
    // A person block starts at a pure-integer rank line.
    if (!/^\d+$/.test(lines[i])) { i++; continue }
    // Need at least 9 more lines for a full block.
    if (i + 9 >= lines.length + 1 && lines.length - i < 9) break
    const roleCode = lines[i + 1]
    const name = lines[i + 2]
    // lines[i+3] = role title (ignored)
    const jobsRevLine = lines[i + 4] || ''
    const ajsLine = lines[i + 5] || ''
    // lines[i+6] = 1/6 load rate (ignored)
    const reviewsLine = lines[i + 7] || ''
    // lines[i+8] = third percentage (ignored)
    const npsLine = lines[i + 9] || ''

    // Guard: the jobs/revenue line should contain a $ amount.
    if (!jobsRevLine.includes('$')) { i++; continue }

    const jobsRevParts = jobsRevLine.split(/\s+/)
    const job_count = INT(jobsRevParts[0])
    const revenue = MONEY(jobsRevParts.slice(1).join(' '))
    const resi_ajs = MONEY(ajsLine.split('(')[0])
    // Google reviews: the count in parentheses, e.g. "22.73% (5)" -> 5
    const revMatch = reviewsLine.match(/\(([-\d]+)\)/)
    const google_reviews = revMatch ? INT(revMatch[1]) : 0
    // NPS: leading score, or "-" -> 0
    let nps = 0
    if (npsLine && npsLine !== '-') {
      const npsMatch = npsLine.match(/^[-\d.]+/)
      nps = npsMatch ? Number(npsMatch[0]) || 0 : 0
    }

    people.push({ name: cleanName(name), roleCode, job_count, revenue, resi_ajs, nps, google_reviews })
    i += 10
  }

  // Merge duplicates by cleaned name.
  const byName = new Map()
  for (const p of people) {
    const key = p.name.toLowerCase()
    if (!byName.has(key)) { byName.set(key, { ...p }); continue }
    const e = byName.get(key)
    const totalJobs = e.job_count + p.job_count
    // Weighted average for resi_ajs/nps by job_count (fallback to simple avg).
    const wavg = (ea, pa) => totalJobs > 0
      ? (ea * e.job_count + pa * p.job_count) / totalJobs
      : (ea + pa) / 2
    e.resi_ajs = wavg(e.resi_ajs, p.resi_ajs)
    e.nps = wavg(e.nps, p.nps)
    e.job_count = totalJobs
    e.revenue += p.revenue
    e.google_reviews += p.google_reviews
  }
  return [...byName.values()]
}

/**
 * Split people into two balanced teams. Balance score = 70% revenue + 30%
 * resi_ajs on min-max normalized values. Greedy: sort desc by score and assign
 * each next person to the team with the lower running score, keeping headcount
 * within 1. Low-job-count people (wildcards) get distributed the same way, which
 * naturally spreads them since they add little score to whichever team is behind.
 */
function balanceTeams(people) {
  if (people.length === 0) return [[], []]
  const revs = people.map(p => p.revenue)
  const ajs = people.map(p => p.resi_ajs)
  const norm = (v, arr) => {
    const min = Math.min(...arr), max = Math.max(...arr)
    return max === min ? 0.5 : (v - min) / (max - min)
  }
  const scored = people.map(p => ({
    ...p,
    _score: 0.7 * norm(p.revenue, revs) + 0.3 * norm(p.resi_ajs, ajs),
  }))
  scored.sort((a, b) => b._score - a._score)

  const teams = [[], []]
  const totals = [0, 0]
  for (const p of scored) {
    // Prefer the lower-total team; if equal, the smaller team; tie-break to A.
    let target
    if (totals[0] === totals[1]) target = teams[0].length <= teams[1].length ? 0 : 1
    else target = totals[0] < totals[1] ? 0 : 1
    // Keep headcount within 1: if target is already 2+ ahead in size, flip.
    const other = target === 0 ? 1 : 0
    if (teams[target].length - teams[other].length >= 1 && teams[other].length < teams[target].length) {
      target = other
    }
    teams[target].push(p)
    totals[target] += p._score
  }
  return teams
}

export default function Competition({ isManager }) {
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addMemberTeam, setAddMemberTeam] = useState(null) // team id
  const [newMemberName, setNewMemberName] = useState('')
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [teamNameDraft, setTeamNameDraft] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState(null) // { teams: [ [people], [people] ] }
  const [importError, setImportError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [
      { data: teamData, error: tErr },
      { data: memberData, error: mErr },
    ] = await Promise.all([
      supabase.from('competition_teams').select('*').order('slot'),
      supabase.from('competition_members').select('*').order('created_at'),
    ])
    if (tErr) console.error(tErr)
    if (mErr) console.error(mErr)
    setTeams(teamData || [])
    setMembers(memberData || [])
    setLoading(false)
  }

  async function addMember(teamId) {
    const name = newMemberName.trim()
    if (!name) return
    const id = uid()
    const row = { id, team_id: teamId, name, job_count: 0, resi_ajs: 0, revenue: 0, nps: 0, google_reviews: 0, cancels: 0 }
    const { error } = await supabase.from('competition_members').insert(row)
    if (error) { console.error(error); return }
    setMembers(prev => [...prev, row])
    setNewMemberName('')
    setAddMemberTeam(null)
  }

  async function removeMember(id) {
    const { error } = await supabase.from('competition_members').delete().eq('id', id)
    if (error) { console.error(error); return }
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function setMetric(memberId, key, value) {
    const num = value === '' ? 0 : Number(value)
    if (Number.isNaN(num)) return
    // optimistic update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, [key]: num } : m))
    const { error } = await supabase.from('competition_members').update({ [key]: num }).eq('id', memberId)
    if (error) console.error(error)
  }

  function bump(member, key, delta) {
    const metric = METRICS.find(m => m.key === key)
    const raw = (Number(member[key]) || 0) + delta
    // NPS can be negative; counts (reviews/cancels) floor at 0.
    const next = metric?.allowNegative ? raw : Math.max(0, raw)
    setMetric(member.id, key, next)
  }

  async function renameTeam(teamId) {
    const name = teamNameDraft.trim()
    if (name) {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t))
      const { error } = await supabase.from('competition_teams').update({ name }).eq('id', teamId)
      if (error) console.error(error)
    }
    setEditingTeamId(null)
  }

  async function resetCompetition() {
    const memberIds = members.map(m => m.id)
    if (memberIds.length > 0) {
      const { error } = await supabase.from('competition_members').delete().in('id', memberIds)
      if (error) { console.error(error); return }
    }
    setMembers([])
    setConfirmReset(false)
  }

  function runImportPreview() {
    setImportError('')
    const people = parseLeaderboard(importText)
    if (people.length === 0) {
      setImportError('No people found. Paste the leaderboard rows including rank, name, and the jobs/$revenue line.')
      setImportPreview(null)
      return
    }
    const [teamA, teamB] = balanceTeams(people)
    setImportPreview({ teams: [teamA, teamB], count: people.length })
  }

  async function applyImport() {
    if (!importPreview) return
    const teamsBySlotLocal = [...teams].sort((a, b) => a.slot - b.slot)
    if (teamsBySlotLocal.length < 2) {
      setImportError('Two teams are required. Run competition_tables.sql first.')
      return
    }
    // Replace: delete existing members, then insert the balanced split.
    const existingIds = members.map(m => m.id)
    if (existingIds.length > 0) {
      const { error: delErr } = await supabase.from('competition_members').delete().in('id', existingIds)
      if (delErr) { console.error(delErr); setImportError('Could not clear existing members.'); return }
    }
    const rows = []
    importPreview.teams.forEach((people, teamIdx) => {
      const teamId = teamsBySlotLocal[teamIdx].id
      for (const p of people) {
        rows.push({
          id: uid(), team_id: teamId, name: p.name,
          job_count: Math.round(p.job_count) || 0,
          resi_ajs: Math.round(p.resi_ajs) || 0,
          revenue: Math.round(p.revenue) || 0,
          nps: Math.round((p.nps || 0) * 10) / 10,
          google_reviews: Math.round(p.google_reviews) || 0,
          cancels: 0,
        })
      }
    })
    const { error: insErr } = await supabase.from('competition_members').insert(rows)
    if (insErr) {
      console.error(insErr)
      setImportError(`Could not save: ${insErr.message || insErr.details || 'unknown error'}`)
      return
    }
    setMembers(rows)
    setImportOpen(false)
    setImportText('')
    setImportPreview(null)
  }

  if (loading) {
    return <div className="comp-loading"><div className="loading-spinner" /><p>Loading competition...</p></div>
  }

  const teamsBySlot = [...teams].sort((a, b) => a.slot - b.slot)
  const membersFor = (teamId) => members.filter(m => m.team_id === teamId)

  // Determine leader: count metrics each team leads.
  let leader = null
  if (teamsBySlot.length === 2) {
    const [a, b] = teamsBySlot
    const aMembers = membersFor(a.id)
    const bMembers = membersFor(b.id)
    let aWins = 0, bWins = 0
    for (const metric of METRICS) {
      const av = teamTotal(aMembers, metric)
      const bv = teamTotal(bMembers, metric)
      if (av === bv) continue
      const aBetter = metric.higherBetter ? av > bv : av < bv
      if (aBetter) aWins++; else bWins++
    }
    if (aWins > bWins) leader = { team: a, aWins, bWins }
    else if (bWins > aWins) leader = { team: b, aWins: bWins, bWins: aWins }
    else leader = { tie: true, aWins, bWins }
  }

  return (
    <div className="competition">
      <div className="comp-header-row">
        <div>
          <h2 className="comp-title">Team Competition</h2>
          <p className="comp-subtitle">Operations metrics · two teams, head to head</p>
        </div>
        {isManager && (
          <div className="comp-header-btns">
            <button className="btn btn-primary comp-import-btn" onClick={() => { setImportOpen(true); setImportText(''); setImportPreview(null); setImportError('') }}>
              Import &amp; Balance
            </button>
            <button className="btn btn-ghost comp-reset-btn" onClick={() => setConfirmReset(true)}>
              New Competition
            </button>
          </div>
        )}
      </div>

      {/* Leader banner */}
      {leader && (
        <div className={`comp-banner ${leader.tie ? 'tie' : 'leading'}`}>
          {leader.tie ? (
            <span>It's all tied up — {leader.aWins} metrics each. Bring it home!</span>
          ) : (
            <span>🏆 {leader.team.name} is in the lead — ahead in {leader.aWins} of {METRICS.length} metrics!</span>
          )}
        </div>
      )}

      <div className="comp-teams">
        {teamsBySlot.map(team => {
          const tMembers = membersFor(team.id)
          return (
            <div key={team.id} className={`comp-team-card slot-${team.slot}`}>
              <div className="comp-team-head">
                {editingTeamId === team.id ? (
                  <input
                    className="comp-team-name-input"
                    value={teamNameDraft}
                    onChange={e => setTeamNameDraft(e.target.value)}
                    onBlur={() => renameTeam(team.id)}
                    onKeyDown={e => e.key === 'Enter' && renameTeam(team.id)}
                    autoFocus
                  />
                ) : (
                  <h3 className="comp-team-name">
                    {team.name}
                    {isManager && (
                      <button
                        className="comp-team-edit"
                        onClick={() => { setEditingTeamId(team.id); setTeamNameDraft(team.name) }}
                        title="Rename team"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                  </h3>
                )}
                <span className="comp-team-count">{tMembers.length} {tMembers.length === 1 ? 'member' : 'members'}</span>
              </div>

              {/* Team totals */}
              <div className="comp-totals">
                {METRICS.map(metric => (
                  <div key={metric.key} className="comp-total">
                    <span className="comp-total-label">{metric.label}</span>
                    <span className="comp-total-value">{formatValue(metric.kind, teamTotal(tMembers, metric))}</span>
                  </div>
                ))}
              </div>

              {/* Members */}
              <div className="comp-members">
                {tMembers.length === 0 && (
                  <p className="comp-empty">No members yet.</p>
                )}
                {tMembers.map(member => (
                  <div key={member.id} className="comp-member">
                    <div className="comp-member-head">
                      <span className="comp-member-name">
                        {member.name}
                        {member.job_count > 0 && <span className="comp-member-jobs">{member.job_count} jobs</span>}
                      </span>
                      {isManager && (
                        <button className="comp-member-remove" onClick={() => removeMember(member.id)} title="Remove">✕</button>
                      )}
                    </div>
                    <div className="comp-metric-grid">
                      {METRICS.map(metric => (
                        <div key={metric.key} className="comp-metric">
                          <span className="comp-metric-label">{metric.label}</span>
                          {isManager ? (
                            <div className="comp-metric-edit">
                              {metric.steps && (
                                <button className="comp-step" onClick={() => bump(member, metric.key, -1)} aria-label={`Decrease ${metric.label}`}>−</button>
                              )}
                              <input
                                className="comp-metric-input"
                                type="number"
                                inputMode={metric.kind === 'money' ? 'decimal' : 'numeric'}
                                value={member[metric.key] ?? 0}
                                onChange={e => setMetric(member.id, metric.key, e.target.value)}
                                onFocus={e => e.target.select()}
                              />
                              {metric.steps && (
                                <button className="comp-step" onClick={() => bump(member, metric.key, 1)} aria-label={`Increase ${metric.label}`}>+</button>
                              )}
                            </div>
                          ) : (
                            <span className="comp-metric-value">{formatValue(metric.kind, member[metric.key])}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add member */}
              {isManager && (
                addMemberTeam === team.id ? (
                  <form
                    className="comp-add-form"
                    onSubmit={e => { e.preventDefault(); addMember(team.id) }}
                  >
                    <input
                      className="comp-add-input"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      placeholder="Member name"
                      autoFocus
                    />
                    <button type="submit" className="comp-add-save">Add</button>
                    <button type="button" className="comp-add-cancel" onClick={() => { setAddMemberTeam(null); setNewMemberName('') }}>✕</button>
                  </form>
                ) : (
                  <button className="comp-add-member" onClick={() => { setAddMemberTeam(team.id); setNewMemberName('') }}>
                    + Add Member
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start New Competition?</h2>
              <button className="modal-close" onClick={() => setConfirmReset(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                This clears all members and their metrics from both teams. Team names are kept.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn-confirm" onClick={resetCompetition}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="modal-overlay" onClick={() => setImportOpen(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import &amp; Balance Teams</h2>
              <button className="modal-close" onClick={() => setImportOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                Paste the leaderboard rows from ops.1800gotjunk.com. This reads each
                person's job count, revenue, Resi AJs, Google reviews, and NPS, then
                splits everyone into two balanced teams (by revenue + Resi AJs).
                Cancels stay at 0 — update those manually. Importing replaces the
                current members.
              </p>
              <textarea
                className="field-input"
                style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 12 }}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste leaderboard rows here..."
              />
              {importError && <p className="error-msg">{importError}</p>}

              {importPreview && (
                <div className="comp-import-preview">
                  <p className="comp-import-preview-title">{importPreview.count} people → balanced into 2 teams</p>
                  <div className="comp-import-preview-grid">
                    {importPreview.teams.map((people, idx) => {
                      const rev = people.reduce((s, p) => s + p.revenue, 0)
                      const jobs = people.reduce((s, p) => s + p.job_count, 0)
                      return (
                        <div key={idx} className="comp-import-team">
                          <div className="comp-import-team-head">
                            {(teams.find(t => t.slot === idx + 1)?.name) || `Team ${idx + 1}`}
                            <span>{people.length} · ${rev.toLocaleString()} · {jobs} jobs</span>
                          </div>
                          <ul>
                            {people.map(p => (
                              <li key={p.name}>{p.name} <span>({p.job_count} jobs, ${Math.round(p.revenue).toLocaleString()})</span></li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setImportOpen(false)}>Cancel</button>
              {!importPreview ? (
                <button className="btn-confirm" onClick={runImportPreview} disabled={!importText.trim()}>Preview Split</button>
              ) : (
                <>
                  <button className="btn-cancel" onClick={() => setImportPreview(null)}>Re-edit</button>
                  <button className="btn-confirm" onClick={applyImport}>Apply to Teams</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
