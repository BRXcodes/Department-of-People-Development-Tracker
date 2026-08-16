import React from 'react'
import './DailyCheckin.css'

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDayTitle(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${dayName}, ${month} ${d.getDate()}`
}

export default function DailyCheckin({ members, tasks, day, onToggle, onEdit, onDelete, isManager }) {
  const dayTasks = tasks.filter(t => t.days?.includes(day))

  const totalDay = dayTasks.length
  const completedDay = dayTasks.filter(t => t.completions?.[day] === 'done').length
  const pct = totalDay > 0 ? Math.round((completedDay / totalDay) * 100) : 0

  return (
    <div className="daily">
      <div className="daily-header">
        <h2 className="daily-title">{formatDayTitle(day)} Check-in</h2>
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
        const mDone = mTasks.filter(t => t.completions?.[day] === 'done').length

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
                  <div key={task.id} className={`daily-task ${done === 'done' ? 'done' : done === 'missed' ? 'missed' : ''}`}>
                    <button
                      className="check-circle"
                      onClick={() => onToggle(task.id, day)}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done && <CheckIcon />}
                    </button>
                    <div className="daily-task-info">
                      <span className="daily-task-name">{task.name}</span>
                      {task.description && <span className="daily-task-desc">{task.description}</span>}
                    </div>
                    <div className="daily-task-actions">
                      {isManager && (
                        <>
                          <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit"><EditIcon /></button>
                          <button className="icon-btn delete" onClick={() => onDelete(task.id)} aria-label="Delete"><TrashIcon /></button>
                        </>
                      )}
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
          <div className="daily-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p>No tasks scheduled for {formatDayTitle(day)}</p>
          <p>Use "Assign Task" to add tasks to this day.</p>
        </div>
      )}
    </div>
  )
}
