import React, { useState } from 'react'
import { DAYS } from '../store'
import './Header.css'

export default function Header({ weekLabel, view, setView, selectedDay, setSelectedDay, onOpenAssign, onOpenMembers, onResetWeek }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
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
            <button className="btn btn-ghost" onClick={onOpenMembers}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Team
            </button>
            <button className="btn btn-ghost" onClick={onResetWeek}>
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
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <button className="btn btn-ghost" onClick={() => { onOpenMembers(); setMenuOpen(false) }}>Team</button>
            <button className="btn btn-ghost" onClick={() => { onResetWeek(); setMenuOpen(false) }}>New Week</button>
            <button className="btn btn-primary" onClick={() => { onOpenAssign(); setMenuOpen(false) }}>+ Assign Task</button>
          </div>
        )}

        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Weekly Overview
          </button>
          <button
            className={`toggle-btn ${view === 'daily' ? 'active' : ''}`}
            onClick={() => setView('daily')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Daily Check-in
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
      </div>
    </header>
  )
}
