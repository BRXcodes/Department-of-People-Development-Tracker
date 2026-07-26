import React, { useState } from 'react'
import { DAYS } from '../store'
import './Header.css'

export default function Header({ weekLabel, view, setView, selectedDay, setSelectedDay, onOpenAssign, onOpenMembers, onResetWeek }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <div className="brand-icon">🚛</div>
          <div>
            <h1 className="brand-title">Team Manager</h1>
            <span className="brand-week">Week of {weekLabel}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={onOpenMembers}>
            👥 Team
          </button>
          <button className="btn btn-ghost" onClick={onResetWeek}>
            🔄 New Week
          </button>
          <button className="btn btn-primary" onClick={onOpenAssign}>
            + Assign Task
          </button>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <button className="btn btn-ghost" onClick={() => { onOpenMembers(); setMenuOpen(false) }}>👥 Team</button>
          <button className="btn btn-ghost" onClick={() => { onResetWeek(); setMenuOpen(false) }}>🔄 New Week</button>
          <button className="btn btn-primary" onClick={() => { onOpenAssign(); setMenuOpen(false) }}>+ Assign Task</button>
        </div>
      )}

      <div className="view-toggle">
        <button
          className={`toggle-btn ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => setView('dashboard')}
        >
          📋 Weekly Overview
        </button>
        <button
          className={`toggle-btn ${view === 'daily' ? 'active' : ''}`}
          onClick={() => setView('daily')}
        >
          ✅ Daily Check-in
        </button>
      </div>

      {view === 'daily' && (
        <div className="day-picker">
          {DAYS.map(day => (
            <button
              key={day}
              className={`day-btn ${selectedDay === day ? 'active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
