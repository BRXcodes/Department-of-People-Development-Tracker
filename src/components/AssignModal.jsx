import React, { useState } from 'react'
import { DAYS } from '../store'
import './Modal.css'

const REMINDER_OPTIONS = [
  { value: '', label: 'No Reminder' },
  { value: '06:00', label: '6:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '18:00', label: '6:00 PM' },
]

function MiniCalendar({ selectedDates, onToggleDate, weekStart }) {
  const start = weekStart ? new Date(weekStart) : new Date()
  const [viewMonth, setViewMonth] = useState(start.getMonth())
  const [viewYear, setViewYear] = useState(start.getFullYear())

  // Build calendar grid for the viewed month
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  // Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = lastDay.getDate()
  const weeks = []
  let week = new Array(startOffset).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  function isSelected(day) {
    if (!day) return false
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return selectedDates.includes(dateStr)
  }

  function isToday(day) {
    if (!day) return false
    const now = new Date()
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day
  }

  function handleClick(day) {
    if (!day) return
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onToggleDate(dateStr)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
        <span className="cal-month">{monthLabel}</span>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <span key={d} className="cal-day-label">{d}</span>
        ))}
        {weeks.flat().map((day, i) => (
          <button
            key={i}
            type="button"
            className={`cal-day ${day ? '' : 'empty'} ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => handleClick(day)}
            disabled={!day}
            aria-label={day ? `${monthLabel} ${day}` : undefined}
          >
            {day || ''}
          </button>
        ))}
      </div>
      {selectedDates.length > 0 && (
        <div className="cal-selection-summary">
          {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}

/** Convert a date string "YYYY-MM-DD" to its day name */
function dateToDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

/** Convert day names to date strings for the given week start */
function dayNamesToDates(dayNames, weekStart) {
  const start = weekStart ? new Date(weekStart) : new Date()
  return dayNames.map(name => {
    const idx = DAYS.indexOf(name)
    if (idx === -1) return null
    const d = new Date(start)
    d.setDate(start.getDate() + idx)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }).filter(Boolean)
}

export default function AssignModal({ members, task, onSave, onClose, weekStart }) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [memberIds, setMemberIds] = useState(
    task ? [task.memberId] : []
  )
  // Store selected dates as "YYYY-MM-DD" strings
  const [selectedDates, setSelectedDates] = useState(() => {
    if (task?.days) return dayNamesToDates(task.days, weekStart)
    return []
  })
  const [reminderTime, setReminderTime] = useState(task?.reminder_time || '')

  const isEditing = !!task

  // Derive day names from selected dates for saving
  const days = selectedDates.map(dateToDayName)

  function toggleMember(id) {
    if (isEditing) return
    setMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function toggleDate(dateStr) {
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
    )
  }

  function handleSave() {
    if (!name.trim() || memberIds.length === 0 || days.length === 0) return
    if (isEditing) {
      onSave({ ...task, name: name.trim(), description: description.trim(), memberId: memberIds[0], days, reminder_time: reminderTime || null })
    } else {
      memberIds.forEach(memberId => {
        onSave({ name: name.trim(), description: description.trim(), memberId, days, reminder_time: reminderTime || null })
      })
    }
    onClose()
  }

  const valid = name.trim() && memberIds.length > 0 && days.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Task' : 'Assign Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <label className="field-label">Task Name *</label>
          <input
            className="field-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Morning briefing"
            autoFocus
          />

          <label className="field-label">Description (optional)</label>
          <textarea
            className="field-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any notes or details..."
            rows={2}
          />

          <label className="field-label">
            {isEditing ? 'Assigned To *' : `Assign To * ${memberIds.length > 0 ? `· ${memberIds.length} selected` : ''}`}
          </label>
          {isEditing ? (
            <select
              className="field-input"
              value={memberIds[0]}
              onChange={e => setMemberIds([e.target.value])}
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          ) : (
            <div className="member-selector">
              {members.map(m => {
                const selected = memberIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`member-select-btn ${selected ? 'selected' : ''}`}
                    onClick={() => toggleMember(m.id)}
                  >
                    <span
                      className="member-select-dot"
                      style={{ background: selected ? m.color : 'var(--gray-300)' }}
                    />
                    {m.name}
                    {selected && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <label className="field-label">Days *</label>
          <MiniCalendar
            selectedDates={selectedDates}
            onToggleDate={toggleDate}
            weekStart={weekStart}
          />

          <label className="field-label">Reminder</label>
          <div className="day-selector">
            {REMINDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`day-select-btn ${reminderTime === opt.value ? 'selected' : ''}`}
                onClick={() => setReminderTime(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSave} disabled={!valid}>
            {isEditing
              ? 'Save Changes'
              : memberIds.length > 1
                ? `Assign to ${memberIds.length} Members`
                : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
