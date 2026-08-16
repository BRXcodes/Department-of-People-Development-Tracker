import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './ScenarioTracker.css'

const SCENARIOS = ['1', '2', '3.1', '3.2', '3.3']

function scenarioLabel(s) {
  return `Scenario ${s}`
}

export default function ScenarioTracker({ isManager }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [addName, setAddName] = useState('')
  const [addScenario, setAddScenario] = useState('1')
  const [addNotes, setAddNotes] = useState('')
  const [editScenario, setEditScenario] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [filterScenario, setFilterScenario] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('scenario_members')
      .select('*')
      .order('name')
    if (error) console.error(error)
    setMembers(data || [])
    setLoading(false)
  }

  async function addMember(e) {
    e.preventDefault()
    const name = addName.trim()
    if (!name) return
    const id = uid()
    const { error } = await supabase.from('scenario_members').insert({
      id,
      name,
      scenario: addScenario,
      notes: addNotes.trim() || null,
    })
    if (error) { console.error(error); return }
    setMembers(prev => [...prev, { id, name, scenario: addScenario, notes: addNotes.trim() || null }].sort((a, b) => a.name.localeCompare(b.name)))
    setAddName('')
    setAddScenario('1')
    setAddNotes('')
    setAddModal(false)
  }

  async function updateMember(e) {
    e.preventDefault()
    if (!editModal) return
    const { error } = await supabase.from('scenario_members').update({
      scenario: editScenario,
      notes: editNotes.trim() || null,
    }).eq('id', editModal.id)
    if (error) { console.error(error); return }
    setMembers(prev => prev.map(m => m.id === editModal.id ? { ...m, scenario: editScenario, notes: editNotes.trim() || null } : m))
    setEditModal(null)
  }

  async function removeMember(id) {
    const { error } = await supabase.from('scenario_members').delete().eq('id', id)
    if (error) { console.error(error); return }
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  function openEdit(member) {
    setEditModal(member)
    setEditScenario(member.scenario)
    setEditNotes(member.notes || '')
  }

  const filtered = members
    .filter(m => filterScenario === 'all' || m.scenario === filterScenario)
    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const scenarioCounts = SCENARIOS.reduce((acc, s) => {
    acc[s] = members.filter(m => m.scenario === s).length
    return acc
  }, {})

  if (loading) {
    return <div className="scenario-loading"><div className="loading-spinner" /><p>Loading scenarios...</p></div>
  }

  return (
    <div className="scenario-tracker">
      <div className="scenario-header-row">
        <div>
          <h2 className="scenario-title">Scenario Tracker</h2>
          <p className="scenario-subtitle">{members.length} CEL members</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Member
          </button>
        )}
      </div>

      {/* Scenario filter pills */}
      <div className="scenario-filters">
        <button
          className={`scenario-pill ${filterScenario === 'all' ? 'active' : ''}`}
          onClick={() => setFilterScenario('all')}
        >
          All ({members.length})
        </button>
        {SCENARIOS.map(s => (
          <button
            key={s}
            className={`scenario-pill ${filterScenario === s ? 'active' : ''}`}
            onClick={() => setFilterScenario(f => f === s ? 'all' : s)}
          >
            {scenarioLabel(s)} ({scenarioCounts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="scenario-toolbar">
        <input
          className="scenario-search"
          placeholder="Search members..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Members list */}
      <div className="scenario-list">
        {filtered.length === 0 && (
          <div className="scenario-empty">
            {members.length === 0 ? (
              <>
                <p>No CEL members added yet.</p>
                <p>Click "Add Member" to get started.</p>
              </>
            ) : (
              <p>No members match the current filter.</p>
            )}
          </div>
        )}
        {filtered.map(member => (
          <div key={member.id} className={`scenario-card scenario-${member.scenario.replace('.', '-')}`}>
            <div className="scenario-card-main">
              <div className="scenario-card-info">
                <span className="scenario-card-name">{member.name}</span>
                <span className={`scenario-badge s-${member.scenario.replace('.', '-')}`}>
                  {scenarioLabel(member.scenario)}
                </span>
              </div>
              {member.notes && (
                <p className="scenario-card-notes">{member.notes}</p>
              )}
            </div>
            {isManager && (
              <div className="scenario-card-actions">
                <button className="scenario-edit-btn" onClick={() => openEdit(member)}>Edit</button>
                <button className="scenario-remove-btn" onClick={() => removeMember(member.id)}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add CEL Member</h2>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <form onSubmit={addMember}>
              <div className="modal-body">
                <label className="field-label">Name *</label>
                <input
                  className="field-input"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                />

                <label className="field-label">Current Scenario *</label>
                <div className="scenario-select-grid">
                  {SCENARIOS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`scenario-select-btn ${addScenario === s ? 'selected' : ''}`}
                      onClick={() => setAddScenario(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <label className="field-label">Notes (what to work on)</label>
                <textarea
                  className="field-input"
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  placeholder="Areas to improve, focus points..."
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={!addName.trim()}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit — {editModal.name}</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <form onSubmit={updateMember}>
              <div className="modal-body">
                <label className="field-label">Current Scenario</label>
                <div className="scenario-select-grid">
                  {SCENARIOS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`scenario-select-btn ${editScenario === s ? 'selected' : ''}`}
                      onClick={() => setEditScenario(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <label className="field-label">Notes (what to work on)</label>
                <textarea
                  className="field-input"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Areas to improve, focus points..."
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn-confirm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
