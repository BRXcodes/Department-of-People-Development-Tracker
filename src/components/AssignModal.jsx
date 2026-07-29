import React, { useState } from 'react'
import { DAYS } from '../store'
import './Modal.css'

export default function AssignModal({ members, task, onSave, onClose }) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  // editing: single member; creating: multi-select
  const [memberIds, setMemberIds] = useState(
    task ? [task.memberId] : []
  )
  const [days, setDays] = useState(task?.days || [])

  const isEditing = !!task

  function toggleMember(id) {
    if (isEditing) return
    setMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function toggleDay(day) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function handleSave() {
    if (!name.trim() || memberIds.length === 0 || days.length === 0) return
    if (isEditing) {
      onSave({ ...task, name: name.trim(), description: description.trim(), memberId: memberIds[0], days })
    } else {
      memberIds.forEach(memberId => {
        onSave({ name: name.trim(), description: description.trim(), memberId, days })
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
          <div className="day-selector">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                className={`day-select-btn ${days.includes(day) ? 'selected' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {day.slice(0, 3)}
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
