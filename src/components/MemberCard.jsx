import React, { useState } from 'react'
import { DAYS, getCurrentWeekDates } from '../store'
import './MemberCard.css'

export default function MemberCard({ member, tasks, onToggle, onEdit, onDelete, isManager }) {
  const [expanded, setExpanded] = useState(true)
  const weekDates = getCurrentWeekDates()

  const totalSlots = tasks.reduce((a, t) => a + (t.days ? t.days.length : 0), 0)
  const completed = tasks.reduce((a, t) => a + DAYS.filter(d => t.days?.includes(d) && t.completions?.[d] === 'done').length, 0)
  const pct = totalSlots > 0 ? Math.round((completed / totalSlots) * 100) : 0

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="member-card">
      <div className="member-header" onClick={() => setExpanded(e => !e)}>
        <div className="member-avatar" style={{ background: member.color }}>
          {initials}
        </div>
        <div className="member-info">
          <span className="member-name">{member.name}</span>i 
          <span className="member-task-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned</span>
        </div>
        <div className="member-progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-pct">{pct}%</span>
        </div>
        <span className={`expand-icon ${expanded ? 'open' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </div>

      {expanded && (
        <div className="member-tasks">
          {tasks.length === 0 && (
            <p className="no-tasks">No tasks assigned yet.</p>
          )}
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} isManager={isManager} weekDates={weekDates} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onEdit, onDelete, isManager, weekDates }) {
  const completedCount = DAYS.filter(d => task.days?.includes(d) && task.completions?.[d] === 'done').length
  const total = task.days?.length || 0

  return (
    <div className="task-row">
      <div className="task-row-top">
        <span className="task-name">{task.name}</span>
        <div className="task-row-actions">
          {isManager && (
            <>
              <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className="icon-btn delete" onClick={() => onDelete(task.id)} aria-label="Delete task">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-days">
        {DAYS.map(day => {
          const assigned = task.days?.includes(day)
          const status = task.completions?.[day] // undefined, 'done', or 'missed'
          if (!assigned) return null
          return (
            <button
              key={day}
              className={`day-chip ${status === 'done' ? 'done' : status === 'missed' ? 'missed' : ''}`}
              onClick={() => onToggle(task.id, day)}
              aria-label={`${day}: ${status === 'done' ? 'completed' : status === 'missed' ? 'incomplete' : 'unset'}`}
            >
              <span>{weekDates[day]} {day.slice(0, 3)}</span>
              {status === 'done' && <span className="check">✓</span>}
              {status === 'missed' && <span className="check">✗</span>}
            </button>
          )
        })}
      </div>
      <div className="task-completion-label">{completedCount}/{total} days completed</div>
    </div>
  )
}
