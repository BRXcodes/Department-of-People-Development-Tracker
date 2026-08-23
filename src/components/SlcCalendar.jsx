import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './SlcCalendar.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SHIFT_COLORS = {
  'Morning lead': '#10B981',
  'Afternoon lead': '#3B82F6',
  'Morning Crew': '#F59E0B',
  'Afternoon Crew': '#8B5CF6',
  '2nd shift ops': '#EC4899',
  'First Shift Ops': '#06B6D4',
  '6:30 Scenario': '#EF4444',
  'Sunday Crew': '#F97316',
  'Truck Maitenence': '#6B7280',
}

function getShiftColor(shift) {
  return SHIFT_COLORS[shift] || '#6B7280'
}

export default function SlcCalendar() {
  const [schedule, setSchedule] = useState([])
  const [weekStart, setWeekStart] = useState('')
  const [loading, setLoading] = useState(true)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [filterShift, setFilterShift] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSchedule()
  }, [])

  async function loadSchedule() {
    setLoading(true)
    const { data, error } = await supabase
      .from('slc_schedule')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) console.error(error)
    if (data && data.length > 0) {
      setSchedule(data[0].data || [])
      setWeekStart(data[0].week_start || '')
    }
    setLoading(false)
  }

  async function handleImport(e) {
    e.preventDefault()
    const parsed = parseCSV(importText)
    if (parsed.length === 0) {
      alert('No valid data found. Make sure you paste the bookmarklet output.')
      return
    }
    // Store the schedule
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.getFullYear(), today.getMonth(), diff)
    const weekStartStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

    const id = uid()
    const { error } = await supabase.from('slc_schedule').insert({
      id,
      week_start: weekStartStr,
      data: parsed,
    })
    if (error) console.error(error)
    setSchedule(parsed)
    setWeekStart(weekStartStr)
    setImportModal(false)
    setImportText('')
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n')
    const results = []
    for (const line of lines) {
      const parts = line.split(',')
      if (parts.length < 8) continue
      const name = parts[0].trim()
      // Skip header row or "All" row
      if (!name || name === 'Name' || name === 'All') continue
      const shifts = parts.slice(1, 8).map(s => {
        const val = s.trim()
        return val === 'Select Shift' ? null : val
      })
      results.push({ name, shifts })
    }
    return results.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get unique shifts for filter
  const allShifts = [...new Set(schedule.flatMap(s => s.shifts.filter(Boolean)))]

  const filtered = schedule
    .filter(s => {
      if (filterShift === 'all') return true
      if (filterShift === 'off') return s.shifts.some(sh => !sh)
      return s.shifts.includes(filterShift)
    })
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return <div className="slc-loading"><div className="loading-spinner" /><p>Loading schedule...</p></div>
  }

  return (
    <div className="slc-calendar">
      <div className="slc-header-row">
        <div>
          <h2 className="slc-title">SLC Calendar</h2>
          {weekStart && <p className="slc-subtitle">Week of {new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setImportModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Import Schedule
        </button>
      </div>

      {schedule.length > 0 && (
        <>
          {/* Filter and search */}
          <div className="slc-toolbar">
            <input
              className="slc-search"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="slc-filter-select"
              value={filterShift}
              onChange={e => setFilterShift(e.target.value)}
            >
              <option value="all">All Shifts</option>
              <option value="off">Off / Unassigned</option>
              {allShifts.sort().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Schedule grid */}
          <div className="slc-grid-wrapper">
            <div className="slc-grid">
              <div className="slc-grid-header">
                <div className="slc-name-col">Name</div>
                {DAYS.map(d => (
                  <div key={d} className="slc-day-col">{d.slice(0, 3)}</div>
                ))}
              </div>
              {filtered.map(row => (
                <div key={row.name} className="slc-grid-row">
                  <div className="slc-name-cell">{row.name}</div>
                  {row.shifts.map((shift, i) => (
                    <div key={i} className={`slc-shift-cell ${shift ? '' : 'off'}`}>
                      {shift ? (
                        <span className="slc-shift-badge" style={{ borderLeftColor: getShiftColor(shift) }}>
                          {shift}
                        </span>
                      ) : (
                        <span className="slc-off">Off</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {schedule.length === 0 && (
        <div className="slc-empty">
          <p>No schedule imported yet.</p>
          <p>Use the bookmarklet on Southwind, then click "Import Schedule" and paste the data.</p>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <div className="modal-overlay" onClick={() => setImportModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Schedule</h2>
              <button className="modal-close" onClick={() => setImportModal(false)}>✕</button>
            </div>
            <form onSubmit={handleImport}>
              <div className="modal-body">
                <label className="field-label">Paste schedule data from bookmarklet</label>
                <textarea
                  className="field-input"
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Name,Monday,Tuesday,Wednesday..."
                  rows={8}
                  autoFocus
                />
                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  Go to Southwind → click the "Extract Schedule" bookmark → paste here
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setImportModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={!importText.trim()}>Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
