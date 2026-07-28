import React, { useState } from 'react'
import { DAYS } from '../store'
import './Header.css'
import './Modal.css'

export default function Header({ weekLabel, view, setView, selectedDay, setSelectedDay, onOpenAssign, onOpenMembers, onResetWeek, isManager, onLogin, onLogout, teams, activeTeamId, onSelectTeam, onAddTeam, onRenameTeam }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [loginModal, setLoginModal] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [addTeamModal, setAddTeamModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [renamingTeamId, setRenamingTeamId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  function handleAddTeam(e) {
    e.preventDefault()
    const name = newTeamName.trim()
    if (!name) return
    onAddTeam(name)
    setNewTeamName('')
    setAddTeamModal(false)
  }

  function startRename(team) {
    setRenamingTeamId(team.id)
    setRenameValue(team.name)
  }

  function handleRename(e) {
    e.preventDefault()
    const name = renameValue.trim()
    if (name) onRenameTeam(renamingTeamId, name)
    setRenamingTeamId(null)
  }

  function handleResetClick() { setConfirmReset(true); setMenuOpen(false) }
  function handleResetConfirm() { onResetWeek(); setConfirmReset(false) }

  function handleLoginSubmit(e) {
    e.preventDefault()
    const ok = onLogin(password)
    if (ok) {
      setLoginModal(false)
      setPassword('')
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  return (
  <>
    <header className="header">
      <div className="header-inner">
        <div className="header-top">
          <div className="header-brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">People Development</h1>
              <span className="brand-week">Week of {weekLabel}</span>
            </div>
          </div>

          <div className="header-actions">
            {isManager ? (
              <>
                <button className="btn btn-ghost" onClick={onOpenMembers}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Team
                </button>
                <button className="btn btn-ghost" onClick={handleResetClick}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  New Week
                </button>
                <button className="btn btn-primary" onClick={onOpenAssign}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Assign Task
                </button>
                <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Lock manager">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </button>
              </>
            ) : (
              <button className="btn btn-ghost btn-icon" onClick={() => setLoginModal(true)} title="Manager login">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Manager</span>
              </button>
            )}
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            {isManager ? (
              <>
                <button className="btn btn-ghost" onClick={() => { onOpenMembers(); setMenuOpen(false) }}>Team</button>
                <button className="btn btn-ghost" onClick={handleResetClick}>New Week</button>
                <button className="btn btn-primary" onClick={() => { onOpenAssign(); setMenuOpen(false) }}>+ Assign Task</button>
                <button className="btn btn-ghost" onClick={() => { onLogout(); setMenuOpen(false) }}>Lock Manager</button>
              </>
            ) : (
              <button className="btn btn-ghost" onClick={() => { setLoginModal(true); setMenuOpen(false) }}>Manager Login</button>
            )}
          </div>
        )}

        <div className="team-tabs">
          {teams.map(team => (
            <div key={team.id} className={`team-tab ${team.id === activeTeamId ? 'active' : ''}`}>
              {renamingTeamId === team.id ? (
                <form onSubmit={handleRename} className="team-rename-form">
                  <input
                    className="team-rename-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    autoFocus
                    onBlur={handleRename}
                  />
                </form>
              ) : (
                <>
                  <button className="team-tab-btn" onClick={() => onSelectTeam(team.id)}>
                    {team.name}
                  </button>
                  {isManager && team.id === activeTeamId && (
                    <button className="team-tab-rename" onClick={() => startRename(team)} title="Rename team">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          {isManager && (
            <button className="team-tab-add" onClick={() => setAddTeamModal(true)} title="Add team">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Team
            </button>
          )}
        </div>

        <div className="view-toggle">
          <button className={`toggle-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Weekly Overview
          </button>
          <button className={`toggle-btn ${view === 'daily' ? 'active' : ''}`} onClick={() => setView('daily')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Daily Check-in
          </button>
        </div>

        {view === 'daily' && (
          <div className="day-picker">
            {DAYS.map(day => (
              <button key={day} className={`day-btn ${selectedDay === day ? 'active' : ''}`} onClick={() => setSelectedDay(day)}>
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>

    {confirmReset && (
      <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
        <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Start New Week?</h2>
            <button className="modal-close" onClick={() => setConfirmReset(false)}>✕</button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
              This will clear all completion records for the current week. Tasks and team members won't be affected.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="btn-confirm" onClick={handleResetConfirm}>Yes, Start New Week</button>
          </div>
        </div>
      </div>
    )}

    {loginModal && (
      <div className="modal-overlay" onClick={() => { setLoginModal(false); setPassword(''); setLoginError(false) }}>
        <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Manager Login</h2>
            <button className="modal-close" onClick={() => { setLoginModal(false); setPassword(''); setLoginError(false) }}>✕</button>
          </div>
          <form onSubmit={handleLoginSubmit}>
            <div className="modal-body">
              <label className="field-label">Password</label>
              <input
                className={`field-input ${loginError ? 'input-error' : ''}`}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(false) }}
                placeholder="Enter manager password"
                autoFocus
              />
              {loginError && <p className="error-msg">Incorrect password</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => { setLoginModal(false); setPassword(''); setLoginError(false) }}>Cancel</button>
              <button type="submit" className="btn-confirm">Unlock</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {addTeamModal && (
      <div className="modal-overlay" onClick={() => { setAddTeamModal(false); setNewTeamName('') }}>
        <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add New Team</h2>
            <button className="modal-close" onClick={() => { setAddTeamModal(false); setNewTeamName('') }}>✕</button>
          </div>
          <form onSubmit={handleAddTeam}>
            <div className="modal-body">
              <label className="field-label">Team Name</label>
              <input
                className="field-input"
                type="text"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. Sales Team"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => { setAddTeamModal(false); setNewTeamName('') }}>Cancel</button>
              <button type="submit" className="btn-confirm">Create Team</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  )
}
