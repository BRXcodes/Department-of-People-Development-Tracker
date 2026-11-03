import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './Safety.css'

// Clip types tracked separately. 3 of the SAME type = termination.
const CLIP_TYPES = [
  { value: 'seatbelt', label: 'Seatbelt Violation', short: 'Seatbelt' },
  { value: 'distracted', label: 'Distracted Driving', short: 'Distracted' },
  { value: 'backing', label: 'Backing Without a Spotter', short: 'Backing' },
]
const TERMINATION_COUNT = 3

function clipLabel(type) {
  return CLIP_TYPES.find(t => t.value === type)?.label || type
}

// Status is driven by the worst (highest) single-type count.
function getStatusColor(maxCount) {
  if (maxCount >= TERMINATION_COUNT) return 'red'
  if (maxCount === TERMINATION_COUNT - 1) return 'yellow'
  return 'green'
}

function getStatusLabel(maxCount) {
  if (maxCount >= TERMINATION_COUNT) return 'Termination'
  if (maxCount === TERMINATION_COUNT - 1) return 'Final Warning'
  return 'Good Standing'
}

export default function Safety({ isManager }) {
  const [employees, setEmployees] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [logModal, setLogModal] = useState(null) // employee id
  const [addName, setAddName] = useState('')
  const [clipType, setClipType] = useState('seatbelt')
  const [clipNote, setClipNote] = useState('')
  const [clipDate, setClipDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadSafety()
  }, [])

  async function loadSafety() {
    setLoading(true)
    const [
      { data: empData, error: empErr },
      { data: incData, error: incErr },
    ] = await Promise.all([
      supabase.from('safety_members').select('*').order('name'),
      supabase.from('safety_incidents').select('*').order('created_at', { ascending: false }),
    ])
    if (empErr) console.error(empErr)
    if (incErr) console.error(incErr)
    setEmployees(empData || [])
    setIncidents(incData || [])
    setLoading(false)
  }

  async function addEmployee(e) {
    e.preventDefault()
    const name = addName.trim()
    if (!name) return
    const id = uid()
    const { error } = await supabase.from('safety_members').insert({ id, name })
    if (error) { console.error(error); return }
    setEmployees(prev => [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name)))
    setAddName('')
    setAddModal(false)
  }

  async function removeEmployee(id) {
    const { error } = await supabase.from('safety_members').delete().eq('id', id)
    if (error) { console.error(error); return }
    setEmployees(prev => prev.filter(e => e.id !== id))
    setIncidents(prev => prev.filter(i => i.employee_id !== id))
  }

  // Pull everyone from the Attendance tracker who isn't already a driver here.
  async function importFromAttendance() {
    setImporting(true)
    const { data: attMembers, error } = await supabase.from('attendance_members').select('id, name')
    if (error) { console.error(error); setImporting(false); return }

    const existingIds = new Set(employees.map(e => e.id))
    const existingNames = new Set(employees.map(e => e.name.trim().toLowerCase()))
    const toAdd = (attMembers || []).filter(
      m => !existingIds.has(m.id) && !existingNames.has(m.name.trim().toLowerCase())
    )

    if (toAdd.length === 0) {
      setImporting(false)
      alert('Everyone from Attendance is already on the Safety board.')
      return
    }

    const rows = toAdd.map(m => ({ id: m.id, name: m.name }))
    const { error: insErr } = await supabase.from('safety_members').insert(rows)
    if (insErr) { console.error(insErr); setImporting(false); return }

    setEmployees(prev => [...prev, ...rows].sort((a, b) => a.name.localeCompare(b.name)))
    setImporting(false)
    alert(`Imported ${rows.length} driver${rows.length === 1 ? '' : 's'} from Attendance.`)
  }

  async function logClip(e) {
    e.preventDefault()
    if (!logModal) return
    const id = uid()
    const { error } = await supabase.from('safety_incidents').insert({
      id,
      employee_id: logModal,
      type: clipType,
      note: clipNote.trim() || null,
      date: clipDate,
    })
    if (error) { console.error(error); return }
    setIncidents(prev => [{ id, employee_id: logModal, type: clipType, note: clipNote.trim() || null, date: clipDate, created_at: new Date().toISOString() }, ...prev])
    setLogModal(null)
    setClipType('seatbelt')
    setClipNote('')
    setClipDate(new Date().toISOString().slice(0, 10))
  }

  async function removeIncident(incidentId) {
    const { error } = await supabase.from('safety_incidents').delete().eq('id', incidentId)
    if (error) { console.error(error); return }
    setIncidents(prev => prev.filter(i => i.id !== incidentId))
  }

  // Count of each clip type for an employee, e.g. { seatbelt: 2, distracted: 0, backing: 1 }
  function getCounts(employeeId) {
    const counts = {}
    for (const t of CLIP_TYPES) counts[t.value] = 0
    for (const i of incidents) {
      if (i.employee_id === employeeId && counts[i.type] != null) counts[i.type]++
    }
    return counts
  }

  function getMaxCount(employeeId) {
    return Math.max(0, ...Object.values(getCounts(employeeId)))
  }

  const filteredEmployees = employees
    .map(emp => ({ ...emp, counts: getCounts(emp.id), maxCount: getMaxCount(emp.id) }))
    .filter(emp => {
      if (filterStatus === 'green') return emp.maxCount <= TERMINATION_COUNT - 2
      if (filterStatus === 'yellow') return emp.maxCount === TERMINATION_COUNT - 1
      if (filterStatus === 'red') return emp.maxCount >= TERMINATION_COUNT
      return true
    })
    .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const stats = {
    total: employees.length,
    green: employees.filter(e => getMaxCount(e.id) <= TERMINATION_COUNT - 2).length,
    yellow: employees.filter(e => getMaxCount(e.id) === TERMINATION_COUNT - 1).length,
    red: employees.filter(e => getMaxCount(e.id) >= TERMINATION_COUNT).length,
  }

  if (loading) {
    return <div className="safety-loading"><div className="loading-spinner" /><p>Loading safety board...</p></div>
  }

  return (
    <div className="safety">
      <div className="safety-header-row">
        <div>
          <h2 className="safety-title">Fleet &amp; Safety</h2>
          <p className="safety-subtitle">{stats.total} drivers · 3 of the same clip = termination</p>
        </div>
        {isManager && (
          <div className="safety-header-actions">
            <button className="btn btn-secondary" onClick={importFromAttendance} disabled={importing}>
              {importing ? 'Importing...' : 'Import from Attendance'}
            </button>
            <button className="btn btn-primary" onClick={() => setAddModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Driver
            </button>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="safety-stats">
        <div className="saf-stat green" onClick={() => setFilterStatus(f => f === 'green' ? 'all' : 'green')}>
          <span className="saf-stat-num">{stats.green}</span>
          <span className="saf-stat-label">Good Standing</span>
          <span className="saf-stat-range">0-1 pts</span>
        </div>
        <div className="saf-stat yellow" onClick={() => setFilterStatus(f => f === 'yellow' ? 'all' : 'yellow')}>
          <span className="saf-stat-num">{stats.yellow}</span>
          <span className="saf-stat-label">Final Warning</span>
          <span className="saf-stat-range">2 pts</span>
        </div>
        <div className="saf-stat red" onClick={() => setFilterStatus(f => f === 'red' ? 'all' : 'red')}>
          <span className="saf-stat-num">{stats.red}</span>
          <span className="saf-stat-label">Termination</span>
          <span className="saf-stat-range">3+ pts</span>
        </div>
      </div>

      {/* Search */}
      <div className="safety-toolbar">
        <input
          className="saf-search"
          placeholder="Search drivers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {filterStatus !== 'all' && (
          <button className="saf-filter-clear" onClick={() => setFilterStatus('all')}>
            Clear filter ✕
          </button>
        )}
      </div>

      {/* Driver list */}
      <div className="safety-list">
        {filteredEmployees.length === 0 && (
          <div className="saf-empty">
            {employees.length === 0 ? (
              <>
                <p>No drivers added yet.</p>
                <p>Click "Add Driver" to get started.</p>
              </>
            ) : (
              <p>No drivers match the current filter.</p>
            )}
          </div>
        )}
        {filteredEmployees.map(emp => {
          const color = getStatusColor(emp.maxCount)
          const empIncidents = incidents.filter(i => i.employee_id === emp.id)
          const isExpanded = expandedId === emp.id
          return (
            <div key={emp.id} className={`saf-card ${color}`}>
              <div className="saf-card-main" onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                <div className={`saf-card-indicator ${color}`} />
                <div className="saf-card-info">
                  <span className="saf-card-name">{emp.name}</span>
                  <span className={`saf-card-status ${color}`}>{getStatusLabel(emp.maxCount)}</span>
                </div>
                <div className="saf-card-counts">
                  {CLIP_TYPES.map(t => {
                    const c = emp.counts[t.value]
                    return (
                      <span key={t.value} className={`saf-count-chip ${getStatusColor(c)}`} title={t.label}>
                        {t.short} {c}/{TERMINATION_COUNT}
                      </span>
                    )
                  })}
                </div>
                <div className="saf-card-actions">
                  {isManager && (
                    <button className="btn-log" onClick={(e) => { e.stopPropagation(); setLogModal(emp.id) }}>
                      + Clip
                    </button>
                  )}
                  <span className={`expand-icon ${isExpanded ? 'open' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </div>
              </div>
              {isExpanded && (
                <div className="saf-card-history">
                  {empIncidents.length === 0 ? (
                    <p className="saf-no-history">No clips recorded.</p>
                  ) : (
                    <div className="saf-incidents">
                      {empIncidents.map(inc => (
                        <div key={inc.id} className="saf-incident">
                          <div className="saf-incident-info">
                            <span className="saf-incident-type">{clipLabel(inc.type)}</span>
                            <span className="saf-incident-date">{inc.date}</span>
                            {inc.note && <span className="saf-incident-note">{inc.note}</span>}
                          </div>
                          {isManager && (
                            <button className="saf-incident-remove" onClick={() => removeIncident(inc.id)} aria-label="Remove clip">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isManager && (
                    <button className="saf-remove-emp" onClick={() => removeEmployee(emp.id)}>Remove Driver</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Driver Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Driver</h2>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <form onSubmit={addEmployee}>
              <div className="modal-body">
                <label className="field-label">Driver Name</label>
                <input
                  className="field-input"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={!addName.trim()}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Clip Modal */}
      {logModal && (
        <div className="modal-overlay" onClick={() => setLogModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Unsafe Driving Clip</h2>
              <button className="modal-close" onClick={() => setLogModal(null)}>✕</button>
            </div>
            <form onSubmit={logClip}>
              <div className="modal-body">
                <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 4 }}>
                  For: <strong>{employees.find(e => e.id === logModal)?.name}</strong>
                </p>

                <label className="field-label">Clip Type</label>
                <div className="saf-type-selector">
                  {CLIP_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      className={`saf-type-btn ${clipType === t.value ? 'selected' : ''}`}
                      onClick={() => setClipType(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <label className="field-label">Date</label>
                <input
                  className="field-input"
                  type="date"
                  value={clipDate}
                  onChange={e => setClipDate(e.target.value)}
                />

                <label className="field-label">Note (optional)</label>
                <input
                  className="field-input"
                  value={clipNote}
                  onChange={e => setClipNote(e.target.value)}
                  placeholder="What happened (e.g. hard brake, speeding)..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setLogModal(null)}>Cancel</button>
                <button type="submit" className="btn-confirm">Log Clip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
