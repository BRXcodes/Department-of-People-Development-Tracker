import React, { useState } from 'react'
import { DAYS } from '../store'
import './MemberCard.css'

export default function MemberCard({ member, tasks, onToggle, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(true)

  const totalSlots = tasks.reduce((a, t) => a + (t.days ? t.days.length : 0), 0)
  const completed = tasks.reduce((a, t) => a + DAYS.filter(d => t.days?.includes(d) && t.completions?.[d]).length, 0)
  const pct = totalSlots > 0 ? Math.round((completed / totalSlots) * 100) : 0

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="member-card">
      <div className="member-header" onClick={() => setExpanded(e => !e)}>
        <div className="member-avatar" style={{ background: member.color }}>
          {initials}
        </div>
        <div className="member-info">
          <span className="member-name">{member.name}</span>
          <span className="member-task-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="member-progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-pct">{pct}%</span>
        </div>
        <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="member-tasks">
          {tasks.length === 0 && (
            <p className="no-tasks">No tasks assigned yet.</p>
          )}
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const completedCount = DAYS.filter(d => task.days?.includes(d) && task.completions?.[d]).length
  const total = task.days?.length || 0

  return (
    <div className="task-row">
      <div className="task-row-top">
        <span className="task-name">{task.name}</span>
        <div className="task-row-actions">
          <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task">✏️</button>
          <button className="icon-btn" onClick={() => onDelete(task.id)} aria-label="Delete task">🗑️</button>
        </div>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-days">
        {DAYS.map(day => {
          const assigned = task.days?.includes(day)
          const done = task.completions?.[day]
          if (!assigned) return null
          return (
            <button
              key={day}
              className={`day-chip ${done ? 'done' : ''}`}
              onClick={() => onToggle(task.id, day)}
              aria-label={`${day}: ${done ? 'completed' : 'incomplete'}`}
            >
              <span>{day.slice(0, 3)}</span>
              <span className="check">{done ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>
      <div className="task-completion-label">{completedCount}/{total} days done</div>
    </div>
  )
}
