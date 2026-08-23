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

export default function SlcCalendar({ isManager }) {
  const [schedule, setSchedule] = useState([])
  const [weekStart, setWeekStart] = useState('')
  const [loading, setLoading] = useState(true)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importWeekStart, setImportWeekStart] = useState(() => {
    // Default to next Monday
    const now = new Date()
    const day = now.getDay()
    const daysUntilMon = day === 0 ? 1 : 8 - day
    const nextMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMon)
    return `${nextMon.getFullYear()}-${String(nextMon.getMonth() + 1).padStart(2, '0')}-${String(nextMon.getDate()).padStart(2, '0')}`
  })
  const [filterShift, setFilterShift] = useState('all')
  const [filterDay, setFilterDay] = useState('all')
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
    const weekStartStr = importWeekStart

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
      const hoursRaw = parts[8] ? parts[8].trim() : '0'
      const hours = parseFloat(hoursRaw) || 0
      results.push({ name, shifts, hours })
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
    .filter(s => {
      if (filterDay === 'all') return true
      const dayIdx = DAYS.indexOf(filterDay)
      return dayIdx >= 0 && s.shifts[dayIdx] !== null
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
        {isManager && (
        <button className="btn btn-primary" onClick={() => setImportModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Import Schedule
        </button>
        )}
      </div>

      {schedule.length > 0 && (
        <>
          {/* Weekly summary calendar */}
          <div className="slc-week-summary">
            {DAYS.map((day, dayIdx) => {
              const morningOps = schedule.filter(s => s.shifts[dayIdx] === 'First Shift Ops').map(s => s.name)
              const secondShift = schedule.filter(s => s.shifts[dayIdx] === '2nd shift ops').map(s => s.name)
              const scenario = schedule.filter(s => s.shifts[dayIdx] === '6:30 Scenario').map(s => s.name)
              const today = new Date()
              const todayDay = today.getDay()
              const isToday = (todayDay === 0 ? 6 : todayDay - 1) === dayIdx
              // Calculate actual date for this day column
              let dateLabel = day.slice(0, 3)
              if (weekStart) {
                const ws = new Date(weekStart + 'T00:00:00')
                const d = new Date(ws)
                d.setDate(ws.getDate() + dayIdx)
                dateLabel = `${day.slice(0, 3)} ${d.getDate()}`
              }
              return (
                <div key={day} className={`slc-summary-day ${isToday ? 'today' : ''}`}>
                  <div className="slc-summary-day-header">
                    <span className="slc-summary-day-name">{dateLabel}</span>
                    {isToday && <span className="slc-summary-today-badge">Today</span>}
                  </div>
                  {morningOps.length > 0 && (
                    <div className="slc-summary-group">
                      <span className="slc-summary-label" style={{ color: '#10B981' }}>First Shift Ops</span>
                      {morningOps.map(n => <span key={n} className="slc-summary-name">{n}</span>)}
                    </div>
                  )}
                  {secondShift.length > 0 && (
                    <div className="slc-summary-group">
                      <span className="slc-summary-label" style={{ color: '#EC4899' }}>2nd Shift</span>
                      {secondShift.map(n => <span key={n} className="slc-summary-name">{n}</span>)}
                    </div>
                  )}
                  {scenario.length > 0 && (
                    <div className="slc-summary-group">
                      <span className="slc-summary-label" style={{ color: '#EF4444' }}>6:30 Scenario</span>
                      {scenario.map(n => <span key={n} className="slc-summary-name">{n}</span>)}
                    </div>
                  )}
                  {morningOps.length === 0 && secondShift.length === 0 && scenario.length === 0 && (
                    <span className="slc-summary-empty">—</span>
                  )}
                </div>
              )
            })}
          </div>

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

          <div className="slc-day-filters">
            <button
              className={`slc-day-filter-btn ${filterDay === 'all' ? 'active' : ''}`}
              onClick={() => setFilterDay('all')}
            >
              All Days
            </button>
            {DAYS.map(d => (
              <button
                key={d}
                className={`slc-day-filter-btn ${filterDay === d ? 'active' : ''}`}
                onClick={() => setFilterDay(f => f === d ? 'all' : d)}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Schedule grid */}
          {filterDay === 'all' ? (
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
                  <div className="slc-name-cell">
                    <span>{row.name}</span>
                    <span className={`slc-hours-badge ${row.hours >= 40 ? 'red' : row.hours >= 31 ? 'green' : row.hours >= 16 ? 'yellow' : 'orange'}`}>
                      {row.hours}h
                    </span>
                    <span className="slc-shifts-badge">
                      {row.shifts.filter(Boolean).length} shifts left
                    </span>
                  </div>
                  {row.shifts.map((shift, i) => (
                    <div key={i} className={`slc-shift-cell ${shift ? '' : 'off'}`}>
                      {shift ? (
                        <span className="slc-shift-badge" style={{ borderLeftColor: getShiftColor(shift) }}>
                          {shift}
                        </span>
                      ) : (
                        <span className="slc-off">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          ) : (
          <div className="slc-day-list">
            {[...filtered].sort((a, b) => {
              const dayIdx = DAYS.indexOf(filterDay)
              const shiftA = a.shifts[dayIdx] || ''
              const shiftB = b.shifts[dayIdx] || ''
              const order = ['6:30 Scenario', 'First Shift Ops', 'Morning lead', 'Morning Crew', 'Afternoon lead', 'Afternoon Crew', '2nd shift ops', 'Sunday Crew', 'Truck Maitenence']
              const idxA = order.indexOf(shiftA)
              const idxB = order.indexOf(shiftB)
              const rankA = idxA >= 0 ? idxA : 99
              const rankB = idxB >= 0 ? idxB : 99
              return rankA - rankB || a.name.localeCompare(b.name)
            }).map(row => {
              const dayIdx = DAYS.indexOf(filterDay)
              const shift = row.shifts[dayIdx]
              return (
                <div key={row.name} className="slc-day-list-item">
                  <span className="slc-day-list-name">{row.name}</span>
                  <span className={`slc-hours-badge ${row.hours >= 40 ? 'red' : row.hours >= 31 ? 'green' : row.hours >= 16 ? 'yellow' : 'orange'}`}>
                    {row.hours}h
                  </span>
                  <span className="slc-shifts-badge">
                    {row.shifts.filter(Boolean).length} shifts left
                  </span>
                  <span className="slc-day-list-shift" style={{ borderLeftColor: getShiftColor(shift) }}>
                    {shift}
                  </span>
                </div>
              )
            })}
          </div>
          )}
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
                <label className="field-label">Week Starting (Monday)</label>
                <input
                  className="field-input"
                  type="date"
                  value={importWeekStart}
                  onChange={e => setImportWeekStart(e.target.value)}
                />

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
