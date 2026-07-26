import React, { useState } from 'react'
import { uid } from '../store'
import './Modal.css'

const COLORS = ['#003DA5','#0055C8','#1A6FD4','#4CAF50','#388E3C','#1565C0','#2E7D32','#0D47A1','#26A69A','#7B1FA2']

export default function MembersModal({ members, onSave, onClose }) {
  const [list, setList] = useState(members.map(m => ({ ...m })))

  function updateName(id, name) {
    setList(l => l.map(m => m.id === id ? { ...m, name } : m))
  }

  function updateColor(id, color) {
    setList(l => l.map(m => m.id === id ? { ...m, color } : m))
  }

  function addMember() {
    setList(l => [...l, { id: uid(), name: '', color: COLORS[l.length % COLORS.length] }])
  }

  function removeMember(id) {
    setList(l => l.filter(m => m.id !== id))
  }

  function handleSave() {
    const filtered = list.filter(m => m.name.trim())
    onSave(filtered.map(m => ({ ...m, name: m.name.trim() })))
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Team Members</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {list.map((member, i) => (
            <div key={member.id} className="member-row">
              <div className="color-swatch" style={{ background: member.color }} />
              <input
                className="field-input member-name-input"
                value={member.name}
                onChange={e => updateName(member.id, e.target.value)}
                placeholder={`Member ${i + 1}`}
              />
              <select
                className="color-select"
                value={member.color}
                onChange={e => updateColor(member.id, e.target.value)}
                aria-label="Pick color"
              >
                {COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button className="remove-btn" onClick={() => removeMember(member.id)} aria-label="Remove member">✕</button>
            </div>
          ))}
          <button className="add-member-btn" onClick={addMember}>+ Add Member</button>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSave}>Save Team</button>
        </div>
      </div>
    </div>
  )
}
