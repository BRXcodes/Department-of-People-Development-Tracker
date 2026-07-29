import React, { useState } from 'react'
import './Modal.css'

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6B7280' },
  { value: 'medium', label: 'Medium', color: '#D97706' },
  { value: 'high', label: 'High', color: '#DC2626' },
  { value: 'urgent', label: 'Urgent', color: '#7C3AED' },
]

export default function TruckIssueModal({ members, task, onSave, onClose }) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [memberId, setMemberId] = useState(task?.memberId || members[0]?.id || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.due_date || '')

  function handleSave() {
    if (!name.trim() || !memberId) return
    onSave({
      ...(task || {}),
      name: name.trim(),
      description: description.trim(),
      memberId,
      days: ['issue'],
      priority,
      due_date: dueDate || null,
    })
    onClose()
  }

  const valid = name.trim() && memberId

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Issue' : 'Log Issue'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <label className="field-label">Issue *</label>
          <input
            className="field-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Check engine light, Emissions due"
            autoFocus
          />

          <label className="field-label">Notes (optional)</label>
          <textarea
            className="field-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any details, error codes, observations..."
            rows={2}
          />

          <label className="field-label">Truck *</label>
          <select className="field-input" value={memberId} onChange={e => setMemberId(e.target.value)}>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <label className="field-label">Priority</label>
          <div className="priority-selector">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                className={`priority-btn ${priority === p.value ? 'selected' : ''}`}
                style={{ '--p-color': p.color }}
                onClick={() => setPriority(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="field-label">Due Date (optional)</label>
          <input
            className="field-input"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSave} disabled={!valid}>
            {task ? 'Save Changes' : 'Log Issue'}
          </button>
        </div>
      </div>
    </div>
  )
}
