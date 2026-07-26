import React, { useState } from 'react'
import { DAYS } from '../store'
import './Modal.css'

export default function AssignModal({ members, task, onSave, onClose }) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [memberId, setMemberId] = useState(task?.memberId || members[0]?.id || '')
  const [days, setDays] = useState(task?.days || [])

  function toggleDay(day) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function handleSave() {
    if (!name.trim() || !memberId || days.length === 0) return
    onSave({ ...(task || {}), name: name.trim(), description: description.trim(), memberId, days })
    onClose()
  }

  const valid = name.trim() && memberId && days.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Assign Task'}</h2>
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

          <label className="field-label">Assign To *</label>
          <select className="field-input" value={memberId} onChange={e => setMemberId(e.target.value)}>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

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
            {task ? 'Save Changes' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
