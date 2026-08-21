import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './ScenarioTracker.css'

const SCENARIOS = ['1', '2', '3.1', '3.2', '3.3']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function scenarioLabel(s) {
  return `Scenario ${s}`
}

function getWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: `${DAY_NAMES[i]} ${d.getDate()}`,
      isToday: d.toDateString() === now.toDateString(),
    }
  })
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function ScenarioTracker({ isManager }) {
  const [members, setMembers] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [scheduleModal, setScheduleModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addScenario, setAddScenario] = useState('1')
  const [addNotes, setAddNotes] = useState('')
  const [editScenario, setEditScenario] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [filterScenario, setFilterScenario] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Schedule modal state
  const [schedMemberId, setSchedMemberId] = useState('')
  const [schedScenario, setSchedScenario] = useState('1')
  const [schedDates, setSchedDates] = useState([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [
      { data: attData, error: attErr },
      { data: scenData, error: scenErr },
      { data: schedData, error: schedErr },
    ] = await Promise.all([
      supabase.from('attendance_members').select('*').order('name'),
      supabase.from('scenario_members').select('*'),
      supabase.from('scenario_schedule').select('*').order('date'),
    ])
    if (attErr) console.error(attErr)
    if (scenErr) console.error(scenErr)
    if (schedErr) console.error(schedErr)
    // Merge attendance members with their scenario data
    const scenarioMap = {}
    for (const s of (scenData || [])) {
      scenarioMap[s.id] = s
    }
    const merged = (attData || []).map(m => ({
      id: m.id,
      name: m.name,
      scenario: scenarioMap[m.id]?.scenario || null,
      notes: scenarioMap[m.id]?.notes || null,
    }))
    setMembers(merged)
    setSchedule(schedData || [])
    setLoading(false)
  }

  async function addMember(e) {
    // No longer used — members come from attendance
    e.preventDefault()
  }

  async function updateMember(e) {
    e.preventDefault()
    if (!editModal) return
    // Upsert into scenario_members using the attendance member's ID
    const { error } = await supabase.from('scenario_members').upsert({
      id: editModal.id,
      name: editModal.name,
      scenario: editScenario,
      notes: editNotes.trim() || null,
    })
    if (error) { console.error(error); return }
    setMembers(prev => prev.map(m => m.id === editModal.id ? { ...m, scenario: editScenario, notes: editNotes.trim() || null } : m))
    setEditModal(null)
  }

  async function removeMember(id) {
    // No longer used — members come from attendance
  }

  async function addScheduleEntry(e) {
    e.preventDefault()
    if (!schedMemberId || schedDates.length === 0) return
    const entries = schedDates.map(date => ({
      id: uid(),
      member_id: schedMemberId,
      scenario: schedScenario,
      date,
    }))
    const { error } = await supabase.from('scenario_schedule').insert(entries)
    if (error) { console.error(error); return }
    setSchedule(prev => [...prev, ...entries].sort((a, b) => a.date.localeCompare(b.date)))
    setScheduleModal(false)
    setSchedMemberId('')
    setSchedScenario('1')
    setSchedDates([])
  }

  async function removeScheduleEntry(id) {
    const { error } = await supabase.from('scenario_schedule').delete().eq('id', id)
    if (error) { console.error(error); return }
    setSchedule(prev => prev.filter(s => s.id !== id))
  }

  function toggleSchedDate(date) {
    setSchedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date].sort())
  }

  function openEdit(member) {
    setEditModal(member)
    setEditScenario(member.scenario)
    setEditNotes(member.notes || '')
  }

  const filtered = members
    .filter(m => filterScenario === 'all' || m.scenario === filterScenario)
    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const scenarioCounts = SCENARIOS.reduce((acc, s) => {
    acc[s] = members.filter(m => m.scenario === s).length
    return acc
  }, {})
  const unassignedCount = members.filter(m => !m.scenario).length

  if (loading) {
    return <div className="scenario-loading"><div className="loading-spinner" /><p>Loading scenarios...</p></div>
  }

  return (
    <div className="scenario-tracker">
      <div className="scenario-header-row">
        <div>
          <h2 className="scenario-title">Scenario Tracker</h2>
          <p className="scenario-subtitle">{members.length} team members</p>
        </div>
      </div>

      {/* Scenario filter pills */}
      <div className="scenario-filters">
        <button
          className={`scenario-pill ${filterScenario === 'all' ? 'active' : ''}`}
          onClick={() => setFilterScenario('all')}
        >
          All ({members.length})
        </button>
        {SCENARIOS.map(s => (
          <button
            key={s}
            className={`scenario-pill ${filterScenario === s ? 'active' : ''}`}
            onClick={() => setFilterScenario(f => f === s ? 'all' : s)}
          >
            {scenarioLabel(s)} ({scenarioCounts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="scenario-toolbar">
        <input
          className="scenario-search"
          placeholder="Search members..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Members list */}
      <div className="scenario-list">
        {filtered.length === 0 && (
          <div className="scenario-empty">
            {members.length === 0 ? (
              <>
                <p>No CEL members added yet.</p>
                <p>Click "Add Member" to get started.</p>
              </>
            ) : (
              <p>No members match the current filter.</p>
            )}
          </div>
        )}
        {filtered.map(member => (
          <div key={member.id} className={`scenario-card ${member.scenario ? `scenario-${member.scenario.replace('.', '-')}` : 'scenario-none'}`}>
            <div className="scenario-card-main">
              <div className="scenario-card-info">
                <span className="scenario-card-name">{member.name}</span>
                {member.scenario ? (
                  <span className={`scenario-badge s-${member.scenario.replace('.', '-')}`}>
                    {scenarioLabel(member.scenario)}
                  </span>
                ) : (
                  <span className="scenario-badge s-none">Not Set</span>
                )}
              </div>
              {member.notes && (
                <p className="scenario-card-notes">{member.notes}</p>
              )}
            </div>
            <div className="scenario-card-actions">
              <button className="scenario-edit-btn" onClick={() => openEdit(member)}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit — {editModal.name}</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <form onSubmit={updateMember}>
              <div className="modal-body">
                <label className="field-label">Current Scenario</label>
                <div className="scenario-select-grid">
                  {SCENARIOS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`scenario-select-btn ${editScenario === s ? 'selected' : ''}`}
                      onClick={() => setEditScenario(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <label className="field-label">Notes (what to work on)</label>
                <textarea
                  className="field-input"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Areas to improve, focus points..."
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn-confirm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Scenarios Schedule */}
      <div className="schedule-section">
        <div className="schedule-header-row">
          <h3 className="schedule-title">Upcoming Scenarios</h3>
          <button className="btn btn-primary" onClick={() => setScheduleModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Schedule
          </button>
        </div>

        <div className="schedule-week">
          {getWeekDates().map(({ date, label, isToday }) => {
            const dayEntries = schedule.filter(s => s.date === date)
            return (
              <div key={date} className={`schedule-day ${isToday ? 'today' : ''}`}>
                <div className="schedule-day-header">
                  <span className="schedule-day-label">{label}</span>
                  {isToday && <span className="schedule-today-badge">Today</span>}
                </div>
                <div className="schedule-day-entries">
                  {dayEntries.length === 0 && (
                    <span className="schedule-day-empty">—</span>
                  )}
                  {dayEntries.map(entry => {
                    const member = members.find(m => m.id === entry.member_id)
                    return (
                      <div key={entry.id} className={`schedule-entry s-${entry.scenario.replace('.', '-')}`}>
                        <span className="schedule-entry-name">{member?.name || 'Unknown'}</span>
                        <span className="schedule-entry-scenario">{scenarioLabel(entry.scenario)}</span>
                        <button className="schedule-entry-remove" onClick={() => removeScheduleEntry(entry.id)} aria-label="Remove">✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="modal-overlay" onClick={() => setScheduleModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Scenario</h2>
              <button className="modal-close" onClick={() => setScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={addScheduleEntry}>
              <div className="modal-body">
                <label className="field-label">Member *</label>
                <select
                  className="field-input"
                  value={schedMemberId}
                  onChange={e => setSchedMemberId(e.target.value)}
                >
                  <option value="">Select a member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <label className="field-label">Scenario *</label>
                <div className="scenario-select-grid">
                  {SCENARIOS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`scenario-select-btn ${schedScenario === s ? 'selected' : ''}`}
                      onClick={() => setSchedScenario(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <label className="field-label">Days *</label>
                <div className="schedule-day-picker">
                  {getWeekDates().map(({ date, label }) => (
                    <button
                      key={date}
                      type="button"
                      className={`schedule-day-btn ${schedDates.includes(date) ? 'selected' : ''}`}
                      onClick={() => toggleSchedDate(date)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={!schedMemberId || schedDates.length === 0}>Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
