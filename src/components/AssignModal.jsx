import React, { useState } from 'react'
import { getTemplates, addTemplate, updateTemplate, removeTemplate, resetTemplate, isBuiltinModified, hiddenBuiltinCount, restoreHiddenBuiltins } from '../assignmentTemplates'
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

  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
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

  function toDateStr(day) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isSelected(day) {
    if (!day) return false
    return selectedDates.includes(toDateStr(day))
  }

  function isToday(day) {
    if (!day) return false
    const now = new Date()
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day
  }

  function handleClick(day) {
    if (!day) return
    onToggleDate(toDateStr(day))
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

export default function AssignModal({ members, task, onSave, onClose, weekStart }) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [memberIds, setMemberIds] = useState(
    task ? [task.memberId] : []
  )
  // Store selected dates as "YYYY-MM-DD" strings directly
  const [selectedDates, setSelectedDates] = useState(() => {
    if (task?.days) return [...task.days].sort()
    return []
  })
  const [reminderTime, setReminderTime] = useState(task?.reminder_time || '')

  const isEditing = !!task

  // Assignment templates (scenarios, whiteboards, etc.)
  const [templates, setTemplates] = useState(() => getTemplates())
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  // Template editor: null = closed, 'new' = adding, or a template id = editing that one
  const [tplEditorMode, setTplEditorMode] = useState(null)
  const [tplLabel, setTplLabel] = useState('')
  const [tplName, setTplName] = useState('')
  const [tplDesc, setTplDesc] = useState('')

  function applyTemplate(tpl) {
    // Toggle off if the same template is clicked again
    if (activeTemplateId === tpl.id) {
      setActiveTemplateId(null)
      return
    }
    setActiveTemplateId(tpl.id)
    setName(tpl.name)
    setDescription(tpl.description || '')
  }

  function openNewTemplate() {
    setTplEditorMode('new')
    setTplLabel('')
    setTplName('')
    setTplDesc('')
  }

  function openEditTemplate(tpl) {
    setTplEditorMode(tpl.id)
    setTplLabel(tpl.label)
    setTplName(tpl.name)
    setTplDesc(tpl.description || '')
  }

  function closeTemplateEditor() {
    setTplEditorMode(null)
  }

  function handleSaveTemplate() {
    const label = tplLabel.trim()
    if (!label) return
    const payload = { label, name: tplName.trim() || label, description: tplDesc }
    const updated = tplEditorMode === 'new'
      ? addTemplate(payload)
      : updateTemplate(tplEditorMode, payload)
    setTemplates(updated)
    // If we just edited the currently applied template, refresh the prefilled fields
    if (tplEditorMode !== 'new' && activeTemplateId === tplEditorMode) {
      setName(payload.name)
      setDescription(payload.description)
    }
    closeTemplateEditor()
  }

  function handleRemoveTemplate(id) {
    setTemplates(removeTemplate(id))
    if (activeTemplateId === id) setActiveTemplateId(null)
    if (tplEditorMode === id) closeTemplateEditor()
  }

  function handleResetTemplate(id) {
    setTemplates(resetTemplate(id))
    if (tplEditorMode === id) closeTemplateEditor()
  }

  function handleRestoreHidden() {
    setTemplates(restoreHiddenBuiltins())
  }

  const numHidden = hiddenBuiltinCount()

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
    if (!name.trim() || memberIds.length === 0 || selectedDates.length === 0) return
    if (isEditing) {
      onSave({ ...task, name: name.trim(), description: description.trim(), memberId: memberIds[0], days: selectedDates, reminder_time: reminderTime || null })
    } else {
      memberIds.forEach(memberId => {
        onSave({ name: name.trim(), description: description.trim(), memberId, days: selectedDates, reminder_time: reminderTime || null })
      })
    }
    onClose()
  }

  const valid = name.trim() && memberIds.length > 0 && selectedDates.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Task' : 'Assign Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {!isEditing && (
            <>
              <div className="template-label-row">
                <label className="field-label" style={{ marginBottom: 0 }}>Quick Templates</label>
                <button
                  type="button"
                  className="template-add-toggle"
                  onClick={() => tplEditorMode === 'new' ? closeTemplateEditor() : openNewTemplate()}
                >
                  {tplEditorMode === 'new' ? 'Cancel' : '+ New template'}
                </button>
              </div>
              <div className="template-picker">
                {templates.map(tpl => (
                  <span
                    key={tpl.id}
                    className={`template-chip ${activeTemplateId === tpl.id ? 'active' : ''} ${tplEditorMode === tpl.id ? 'editing' : ''}`}
                  >
                    <button
                      type="button"
                      className="template-chip-btn"
                      onClick={() => applyTemplate(tpl)}
                    >
                      {tpl.label}
                    </button>
                    <button
                      type="button"
                      className="template-chip-edit"
                      onClick={() => tplEditorMode === tpl.id ? closeTemplateEditor() : openEditTemplate(tpl)}
                      aria-label={`Edit ${tpl.label} template`}
                      title="Edit template"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>

              {numHidden > 0 && (
                <button
                  type="button"
                  className="template-restore-link"
                  onClick={handleRestoreHidden}
                >
                  Restore {numHidden} hidden default{numHidden !== 1 ? 's' : ''}
                </button>
              )}

              {tplEditorMode !== null && (
                <div className="template-add-form">
                  <div className="template-form-title">
                    {tplEditorMode === 'new' ? 'New Template' : 'Edit Template'}
                  </div>
                  <input
                    className="field-input"
                    value={tplLabel}
                    onChange={e => setTplLabel(e.target.value)}
                    placeholder="Template label (e.g. Cold Call Practice)"
                  />
                  <input
                    className="field-input"
                    value={tplName}
                    onChange={e => setTplName(e.target.value)}
                    placeholder="Task name (defaults to label)"
                  />
                  <textarea
                    className="field-input"
                    value={tplDesc}
                    onChange={e => setTplDesc(e.target.value)}
                    placeholder="Default description (optional)"
                    rows={2}
                  />
                  <div className="template-form-actions">
                    {tplEditorMode !== 'new' && (
                      <>
                        <button
                          type="button"
                          className="template-form-delete"
                          onClick={() => handleRemoveTemplate(tplEditorMode)}
                        >
                          Delete
                        </button>
                        {isBuiltinModified(tplEditorMode) && !String(tplEditorMode).startsWith('custom-') && (
                          <button
                            type="button"
                            className="template-form-reset"
                            onClick={() => handleResetTemplate(tplEditorMode)}
                          >
                            Reset to default
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      className="btn-confirm template-add-save"
                      onClick={handleSaveTemplate}
                      disabled={!tplLabel.trim()}
                    >
                      {tplEditorMode === 'new' ? 'Save Template' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <label className="field-label">Task Name *</label>
          <input
            className="field-input"
            value={name}
            onChange={e => { setName(e.target.value); setActiveTemplateId(null) }}
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
