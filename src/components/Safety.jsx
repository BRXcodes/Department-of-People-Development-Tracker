import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './Safety.css'

// 1 point per unsafe-driving clip. 3 points = termination threshold.
const TERMINATION_POINTS = 3

function getStatusColor(points) {
  if (points >= TERMINATION_POINTS) return 'red'
  if (points === TERMINATION_POINTS - 1) return 'yellow'
  return 'green'
}

function getStatusLabel(points) {
  if (points >= TERMINATION_POINTS) return 'Termination'
  if (points === TERMINATION_POINTS - 1) return 'Final Warning'
  return 'Good Standing'
}

export default function Safety({ isManager }) {
  const [employees, setEmployees] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [logModal, setLogModal] = useState(null) // employee id
  const [addName, setAddName] = useState('')
  const [clipPoints, setClipPoints] = useState(1)
  const [clipNote, setClipNote] = useState('')
  const [clipDate, setClipDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)

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

  async function logClip(e) {
    e.preventDefault()
    if (!logModal) return
    const id = uid()
    const points = Number(clipPoints) || 1
    const { error } = await supabase.from('safety_incidents').insert({
      id,
      employee_id: logModal,
      points,
      note: clipNote.trim() || null,
      date: clipDate,
    })
    if (error) { console.error(error); return }
    setIncidents(prev => [{ id, employee_id: logModal, points, note: clipNote.trim() || null, date: clipDate, created_at: new Date().toISOString() }, ...prev])
    setLogModal(null)
    setClipPoints(1)
    setClipNote('')
    setClipDate(new Date().toISOString().slice(0, 10))
  }

  async function removeIncident(incidentId) {
    const { error } = await supabase.from('safety_incidents').delete().eq('id', incidentId)
    if (error) { console.error(error); return }
    setIncidents(prev => prev.filter(i => i.id !== incidentId))
  }

  function getPoints(employeeId) {
    return incidents
      .filter(i => i.employee_id === employeeId)
      .reduce((sum, i) => sum + (i.points || 0), 0)
  }

  const filteredEmployees = employees
    .map(emp => ({ ...emp, points: getPoints(emp.id) }))
    .filter(emp => {
      if (filterStatus === 'green') return emp.points <= TERMINATION_POINTS - 2
      if (filterStatus === 'yellow') return emp.points === TERMINATION_POINTS - 1
      if (filterStatus === 'red') return emp.points >= TERMINATION_POINTS
      return true
    })
    .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const stats = {
    total: employees.length,
    green: employees.filter(e => getPoints(e.id) <= TERMINATION_POINTS - 2).length,
    yellow: employees.filter(e => getPoints(e.id) === TERMINATION_POINTS - 1).length,
    red: employees.filter(e => getPoints(e.id) >= TERMINATION_POINTS).length,
  }

  if (loading) {
    return <div className="safety-loading"><div className="loading-spinner" /><p>Loading safety board...</p></div>
  }

  return (
    <div className="safety">
      <div className="safety-header-row">
        <div>
          <h2 className="safety-title">Fleet &amp; Safety</h2>
          <p className="safety-subtitle">{stats.total} drivers · 3 points = termination</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Driver
          </button>
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
          const color = getStatusColor(emp.points)
          const empIncidents = incidents.filter(i => i.employee_id === emp.id)
          const isExpanded = expandedId === emp.id
          return (
            <div key={emp.id} className={`saf-card ${color}`}>
              <div className="saf-card-main" onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                <div className={`saf-card-indicator ${color}`} />
                <div className="saf-card-info">
                  <span className="saf-card-name">{emp.name}</span>
                  <span className={`saf-card-status ${color}`}>{getStatusLabel(emp.points)}</span>
                </div>
                <div className="saf-card-points">
                  <span className={`saf-points-badge ${color}`}>{emp.points} / {TERMINATION_POINTS}</span>
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
                            <span className="saf-incident-type">Unsafe driving clip</span>
                            <span className="saf-incident-date">{inc.date}</span>
                            {inc.note && <span className="saf-incident-note">{inc.note}</span>}
                          </div>
                          <span className="saf-incident-pts">+{inc.points}</span>
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

                <label className="field-label">Points</label>
                <div className="saf-points-selector">
                  {[1, 2, 3].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`saf-points-btn ${Number(clipPoints) === p ? 'selected' : ''}`}
                      onClick={() => setClipPoints(p)}
                    >
                      +{p}
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
