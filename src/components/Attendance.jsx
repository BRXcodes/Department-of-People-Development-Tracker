import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './Attendance.css'

const INFRACTION_TYPES = [
  { value: 'ncns', label: 'No Call No Show', points: 10 },
  { value: 'same_day', label: 'Same Day Call Out', points: 4 },
  { value: 'late_30', label: '30+ Min Late', points: 2 },
  { value: 'late', label: 'Late', points: 1 },
]

function getStatusColor(points) {
  if (points >= 8) return 'red'
  if (points >= 6) return 'yellow'
  return 'green'
}

function getStatusLabel(points) {
  if (points >= 8) return 'Critical'
  if (points >= 6) return 'Warning'
  return 'Good Standing'
}

export default function Attendance({ isManager }) {
  const [employees, setEmployees] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [logModal, setLogModal] = useState(null) // employee id
  const [addName, setAddName] = useState('')
  const [infractionType, setInfractionType] = useState('late')
  const [infractionNote, setInfractionNote] = useState('')
  const [infractionDate, setInfractionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    loadAttendance()
  }, [])

  async function loadAttendance() {
    setLoading(true)
    const [
      { data: empData, error: empErr },
      { data: incData, error: incErr },
    ] = await Promise.all([
      supabase.from('attendance_members').select('*').order('name'),
      supabase.from('attendance_incidents').select('*').order('created_at', { ascending: false }),
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
    const { error } = await supabase.from('attendance_members').insert({ id, name })
    if (error) { console.error(error); return }
    setEmployees(prev => [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name)))
    setAddName('')
    setAddModal(false)
  }

  async function removeEmployee(id) {
    const { error } = await supabase.from('attendance_members').delete().eq('id', id)
    if (error) { console.error(error); return }
    setEmployees(prev => prev.filter(e => e.id !== id))
    setIncidents(prev => prev.filter(i => i.employee_id !== id))
  }

  async function logInfraction(e) {
    e.preventDefault()
    if (!logModal) return
    const id = uid()
    const type = INFRACTION_TYPES.find(t => t.value === infractionType)
    const { error } = await supabase.from('attendance_incidents').insert({
      id,
      employee_id: logModal,
      type: infractionType,
      points: type.points,
      note: infractionNote.trim() || null,
      date: infractionDate,
    })
    if (error) { console.error(error); return }
    setIncidents(prev => [{ id, employee_id: logModal, type: infractionType, points: type.points, note: infractionNote.trim() || null, date: infractionDate, created_at: new Date().toISOString() }, ...prev])
    setLogModal(null)
    setInfractionType('late')
    setInfractionNote('')
    setInfractionDate(new Date().toISOString().slice(0, 10))
  }

  async function removeIncident(incidentId) {
    const { error } = await supabase.from('attendance_incidents').delete().eq('id', incidentId)
    if (error) { console.error(error); return }
    setIncidents(prev => prev.filter(i => i.id !== incidentId))
  }

  function getPoints(employeeId) {
    return incidents
      .filter(i => i.employee_id === employeeId)
      .reduce((sum, i) => sum + (i.points || 0), 0)
  }

  // Filtered and sorted employees
  const filteredEmployees = employees
    .map(emp => ({ ...emp, points: getPoints(emp.id) }))
    .filter(emp => {
      if (filterStatus === 'green') return emp.points <= 5
      if (filterStatus === 'yellow') return emp.points >= 6 && emp.points <= 7
      if (filterStatus === 'red') return emp.points >= 8
      return true
    })
    .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.points - a.points)

  const stats = {
    total: employees.length,
    green: employees.filter(e => getPoints(e.id) <= 5).length,
    yellow: employees.filter(e => { const p = getPoints(e.id); return p >= 6 && p <= 7 }).length,
    red: employees.filter(e => getPoints(e.id) >= 8).length,
  }

  if (loading) {
    return <div className="attendance-loading"><div className="loading-spinner" /><p>Loading attendance...</p></div>
  }

  return (
    <div className="attendance">
      <div className="attendance-header-row">
        <div>
          <h2 className="attendance-title">Attendance Tracker</h2>
          <p className="attendance-subtitle">{stats.total} team members</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Employee
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="attendance-stats">
        <div className="att-stat green" onClick={() => setFilterStatus(f => f === 'green' ? 'all' : 'green')}>
          <span className="att-stat-num">{stats.green}</span>
          <span className="att-stat-label">Good Standing</span>
          <span className="att-stat-range">0-5 pts</span>
        </div>
        <div className="att-stat yellow" onClick={() => setFilterStatus(f => f === 'yellow' ? 'all' : 'yellow')}>
          <span className="att-stat-num">{stats.yellow}</span>
          <span className="att-stat-label">Warning</span>
          <span className="att-stat-range">6-7 pts</span>
        </div>
        <div className="att-stat red" onClick={() => setFilterStatus(f => f === 'red' ? 'all' : 'red')}>
          <span className="att-stat-num">{stats.red}</span>
          <span className="att-stat-label">Critical</span>
          <span className="att-stat-range">8+ pts</span>
        </div>
      </div>

      {/* Search */}
      <div className="attendance-toolbar">
        <input
          className="att-search"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {filterStatus !== 'all' && (
          <button className="att-filter-clear" onClick={() => setFilterStatus('all')}>
            Clear filter ✕
          </button>
        )}
      </div>

      {/* Point system legend */}
      <div className="att-legend">
        {INFRACTION_TYPES.map(t => (
          <span key={t.value} className="att-legend-item">
            <span className="att-legend-pts">+{t.points}</span> {t.label}
          </span>
        ))}
      </div>

      {/* Employee list */}
      <div className="attendance-list">
        {filteredEmployees.length === 0 && (
          <div className="att-empty">
            {employees.length === 0 ? (
              <>
                <p>No employees added yet.</p>
                <p>Click "Add Employee" to get started.</p>
              </>
            ) : (
              <p>No employees match the current filter.</p>
            )}
          </div>
        )}
        {filteredEmployees.map(emp => {
          const color = getStatusColor(emp.points)
          const empIncidents = incidents.filter(i => i.employee_id === emp.id)
          const isExpanded = expandedId === emp.id
          return (
            <div key={emp.id} className={`att-card ${color}`}>
              <div className="att-card-main" onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                <div className={`att-card-indicator ${color}`} />
                <div className="att-card-info">
                  <span className="att-card-name">{emp.name}</span>
                  <span className={`att-card-status ${color}`}>{getStatusLabel(emp.points)}</span>
                </div>
                <div className="att-card-points">
                  <span className={`att-points-badge ${color}`}>{emp.points} pts</span>
                </div>
                <div className="att-card-actions">
                  {isManager && (
                    <button className="btn-log" onClick={(e) => { e.stopPropagation(); setLogModal(emp.id) }}>
                      + Log
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
                <div className="att-card-history">
                  {empIncidents.length === 0 ? (
                    <p className="att-no-history">No incidents recorded.</p>
                  ) : (
                    <div className="att-incidents">
                      {empIncidents.map(inc => {
                        const type = INFRACTION_TYPES.find(t => t.value === inc.type)
                        return (
                          <div key={inc.id} className="att-incident">
                            <div className="att-incident-info">
                              <span className="att-incident-type">{type?.label || inc.type}</span>
                              <span className="att-incident-date">{inc.date}</span>
                              {inc.note && <span className="att-incident-note">{inc.note}</span>}
                            </div>
                            <span className="att-incident-pts">+{inc.points}</span>
                            {isManager && (
                              <button className="att-incident-remove" onClick={() => removeIncident(inc.id)} aria-label="Remove incident">✕</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {isManager && (
                    <button className="att-remove-emp" onClick={() => removeEmployee(emp.id)}>Remove Employee</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Employee Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Employee</h2>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <form onSubmit={addEmployee}>
              <div className="modal-body">
                <label className="field-label">Employee Name</label>
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

      {/* Log Infraction Modal */}
      {logModal && (
        <div className="modal-overlay" onClick={() => setLogModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Incident</h2>
              <button className="modal-close" onClick={() => setLogModal(null)}>✕</button>
            </div>
            <form onSubmit={logInfraction}>
              <div className="modal-body">
                <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 4 }}>
                  For: <strong>{employees.find(e => e.id === logModal)?.name}</strong>
                </p>

                <label className="field-label">Incident Type</label>
                <div className="att-type-selector">
                  {INFRACTION_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      className={`att-type-btn ${infractionType === t.value ? 'selected' : ''}`}
                      onClick={() => setInfractionType(t.value)}
                    >
                      <span className="att-type-pts">+{t.points}</span>
                      <span className="att-type-label">{t.label}</span>
                    </button>
                  ))}
                </div>

                <label className="field-label">Date</label>
                <input
                  className="field-input"
                  type="date"
                  value={infractionDate}
                  onChange={e => setInfractionDate(e.target.value)}
                />

                <label className="field-label">Note (optional)</label>
                <input
                  className="field-input"
                  value={infractionNote}
                  onChange={e => setInfractionNote(e.target.value)}
                  placeholder="Any additional context..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setLogModal(null)}>Cancel</button>
                <button type="submit" className="btn-confirm">Log Incident</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
