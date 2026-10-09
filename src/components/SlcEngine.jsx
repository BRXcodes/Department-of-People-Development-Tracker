import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './SlcEngine.css'

const ROLES = ['CEL', 'CSL', 'SSL', 'DOPD', 'DOO', 'GM']

function formatDate(dateStr) {
  if (!dateStr) return 'No 1-on-1 logged'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Days since the last 1-on-1, for a gentle "overdue" nudge.
function daysSince(dateStr) {
  if (!dateStr) return null
  const then = new Date(dateStr + 'T00:00:00').getTime()
  return Math.floor((Date.now() - then) / 86400000)
}

export default function SlcEngine() {
  const [employees, setEmployees] = useState([])
  const [attendanceNames, setAttendanceNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [
      { data: engData, error: eErr },
      { data: attData, error: aErr },
    ] = await Promise.all([
      supabase.from('engine_employees').select('*').order('sort_order').order('created_at'),
      supabase.from('attendance_members').select('name').order('name'),
    ])
    if (eErr) console.error(eErr)
    if (aErr) console.error(aErr)
    setEmployees(engData || [])
    setAttendanceNames((attData || []).map(a => a.name))
    setLoading(false)
  }

  async function addEmployee(name) {
    const n = name.trim()
    if (!n) return
    const id = uid()
    const row = {
      id, name: n, role: 'CEL', last_one_on_one: null,
      comments: '', can_drive: false, strengths: '', weaknesses: '',
      sort_order: employees.length,
    }
    const { error } = await supabase.from('engine_employees').insert(row)
    if (error) { console.error(error); return }
    setEmployees(prev => [...prev, row])
    setAddName('')
    setAddOpen(false)
  }

  async function removeEmployee(id) {
    const { error } = await supabase.from('engine_employees').delete().eq('id', id)
    if (error) { console.error(error); return }
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  // Optimistic field update + persist.
  async function updateField(id, field, value) {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    const { error } = await supabase.from('engine_employees').update({ [field]: value }).eq('id', id)
    if (error) console.error(error)
  }

  if (loading) {
    return <div className="engine-loading"><div className="loading-spinner" /><p>Loading the engine...</p></div>
  }

  // Names in attendance not yet added to the engine board (for the add picker).
  const existing = new Set(employees.map(e => e.name.toLowerCase()))
  const available = attendanceNames.filter(n => !existing.has(n.toLowerCase()))

  return (
    <div className="engine">
      <div className="engine-header-row">
        <div>
          <h2 className="engine-title">The SLC Engine</h2>
          <p className="engine-subtitle">Leadership board · 1-on-1s, roles, and development notes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>+ Add Employee</button>
      </div>

      {employees.length === 0 && (
        <div className="engine-empty">
          <p>No employees on the board yet.</p>
          <p>Click "Add Employee" to start tracking.</p>
        </div>
      )}

      <div className="engine-grid">
        {employees.map(emp => {
          const since = daysSince(emp.last_one_on_one)
          const overdue = since != null && since > 30
          return (
            <div key={emp.id} className="engine-card">
              <div className="engine-card-head">
                <div className="engine-card-head-left">
                  <span className="engine-name">{emp.name}</span>
                  <select
                    className="engine-role"
                    value={emp.role}
                    onChange={e => updateField(emp.id, 'role', e.target.value)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="engine-card-head-right">
                  <label className="engine-dot" title="Can drive (DOT)">
                    <input
                      type="checkbox"
                      checked={!!emp.can_drive}
                      onChange={e => updateField(emp.id, 'can_drive', e.target.checked)}
                    />
                    DOT
                  </label>
                  <button className="engine-remove" onClick={() => removeEmployee(emp.id)} title="Remove">✕</button>
                </div>
              </div>

              <div className="engine-dates">
                <div className="engine-datefield">
                  <label className="engine-label">Last 1-on-1</label>
                  <input
                    type="date"
                    className="engine-date"
                    value={emp.last_one_on_one || ''}
                    onChange={e => updateField(emp.id, 'last_one_on_one', e.target.value || null)}
                  />
                  <span className={`engine-since ${overdue ? 'overdue' : ''}`}>
                    {emp.last_one_on_one
                      ? (since === 0 ? 'Today' : `${since} day${since === 1 ? '' : 's'} ago`)
                      : 'No 1-on-1 logged'}
                  </span>
                </div>
                <div className="engine-datefield">
                  <label className="engine-label">Certification Date</label>
                  <input
                    type="date"
                    className="engine-date"
                    value={emp.cert_date || ''}
                    onChange={e => updateField(emp.id, 'cert_date', e.target.value || null)}
                  />
                  <span className="engine-since">
                    {emp.cert_date ? formatDate(emp.cert_date) : 'Not certified'}
                  </span>
                </div>
              </div>

              <div className="engine-field">
                <label className="engine-label">Comments / Priorities</label>
                <textarea
                  className="engine-textarea"
                  rows={2}
                  defaultValue={emp.comments || ''}
                  placeholder="Priorities from the last 1-on-1..."
                  onBlur={e => { if (e.target.value !== (emp.comments || '')) updateField(emp.id, 'comments', e.target.value) }}
                />
              </div>

              <div className="engine-field engine-sw">
                <div className="engine-strength">
                  <label className="engine-label strength">Strengths</label>
                  <textarea
                    className="engine-textarea"
                    rows={2}
                    defaultValue={emp.strengths || ''}
                    placeholder="e.g. Great at bidding house cleanouts"
                    onBlur={e => { if (e.target.value !== (emp.strengths || '')) updateField(emp.id, 'strengths', e.target.value) }}
                  />
                </div>
                <div className="engine-weakness">
                  <label className="engine-label weakness">Weaknesses</label>
                  <textarea
                    className="engine-textarea"
                    rows={2}
                    defaultValue={emp.weaknesses || ''}
                    placeholder="e.g. Struggles on bedload / dirt jobs"
                    onBlur={e => { if (e.target.value !== (emp.weaknesses || '')) updateField(emp.id, 'weaknesses', e.target.value) }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Employee</h2>
              <button className="modal-close" onClick={() => setAddOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {available.length > 0 && (
                <>
                  <label className="field-label">From Attendance</label>
                  <div className="engine-add-list">
                    {available.map(n => (
                      <button key={n} className="engine-add-pick" onClick={() => addEmployee(n)}>{n}</button>
                    ))}
                  </div>
                  <div className="engine-add-divider">or add manually</div>
                </>
              )}
              <label className="field-label">Name</label>
              <input
                className="field-input"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Employee name"
                onKeyDown={e => e.key === 'Enter' && addEmployee(addName)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={() => addEmployee(addName)} disabled={!addName.trim()}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
