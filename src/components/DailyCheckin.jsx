import React from 'react'
import './DailyCheckin.css'

export default function DailyCheckin({ members, tasks, day, onToggle, onEdit, onDelete }) {
  const dayTasks = tasks.filter(t => t.days?.includes(day))

  const totalDay = dayTasks.length
  const completedDay = dayTasks.filter(t => t.completions?.[day]).length
  const pct = totalDay > 0 ? Math.round((completedDay / totalDay) * 100) : 0

  return (
    <div className="daily">
      <div className="daily-header">
        <h2 className="daily-title">{day} Check-in</h2>
        <div className="daily-summary">
          <span className="daily-count">{completedDay}/{totalDay} tasks complete</span>
          <div className="daily-bar">
            <div className="daily-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="daily-pct">{pct}%</span>
        </div>
      </div>

      {members.map(member => {
        const mTasks = dayTasks.filter(t => t.memberId === member.id)
        if (mTasks.length === 0) return null
        const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const mDone = mTasks.filter(t => t.completions?.[day]).length

        return (
          <div key={member.id} className="daily-member">
            <div className="daily-member-header">
              <div className="daily-avatar" style={{ background: member.color }}>{initials}</div>
              <span className="daily-member-name">{member.name}</span>
              <span className="daily-member-count">{mDone}/{mTasks.length}</span>
            </div>
            <div className="daily-tasks">
              {mTasks.map(task => {
                const done = task.completions?.[day]
                return (
                  <div key={task.id} className={`daily-task ${done ? 'done' : ''}`}>
                    <button
                      className="check-circle"
                      onClick={() => onToggle(task.id, day)}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done ? '✓' : ''}
                    </button>
                    <div className="daily-task-info">
                      <span className="daily-task-name">{task.name}</span>
                      {task.description && <span className="daily-task-desc">{task.description}</span>}
                    </div>
                    <div className="daily-task-actions">
                      <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit">✏️</button>
                      <button className="icon-btn" onClick={() => onDelete(task.id)} aria-label="Delete">🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {dayTasks.length === 0 && (
        <div className="daily-empty">
          <p>No tasks assigned for {day}.</p>
          <p>Use "Assign Task" to add some.</p>
        </div>
      )}
    </div>
  )
}
