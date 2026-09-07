import React from 'react'
import './TodayTomorrow.css'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDayTitle(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${dayName}, ${month} ${d.getDate()}`
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function DaySection({ label, dateStr, members, tasks, onToggle }) {
  const dayTasks = tasks.filter(t => t.days?.includes(dateStr))
  const membersWithTasks = members
    .map(member => ({ member, mTasks: dayTasks.filter(t => t.memberId === member.id) }))
    .filter(({ mTasks }) => mTasks.length > 0)

  return (
    <div className="tt-day">
      <div className="tt-day-header">
        <span className="tt-day-label">{label}</span>
        <span className="tt-day-date">{formatDayTitle(dateStr)}</span>
      </div>

      {membersWithTasks.length === 0 ? (
        <div className="tt-day-empty">No responsibilities scheduled.</div>
      ) : (
        <div className="tt-members">
          {membersWithTasks.map(({ member, mTasks }) => {
            const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            const doneCount = mTasks.filter(t => t.completions?.[dateStr] === 'done').length
            return (
              <div key={member.id} className="tt-member">
                <div className="tt-member-header">
                  <div className="tt-avatar" style={{ background: member.color }}>{initials}</div>
                  <span className="tt-member-name">{member.name}</span>
                  <span className="tt-member-count">{doneCount}/{mTasks.length}</span>
                </div>
                <ul className="tt-task-list">
                  {mTasks.map(task => {
                    const done = task.completions?.[dateStr] === 'done'
                    return (
                      <li key={task.id} className={`tt-task ${done ? 'done' : ''}`}>
                        <button
                          className={`tt-check ${done ? 'done' : ''}`}
                          onClick={() => onToggle(task.id, dateStr)}
                          aria-label={done ? `Mark ${task.name} not done` : `Mark ${task.name} done`}
                        >
                          {done && <CheckIcon />}
                        </button>
                        <div className="tt-task-info">
                          <span className="tt-task-name">{task.name}</span>
                          {task.description && <span className="tt-task-desc">{task.description}</span>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TodayTomorrow({ members, tasks, onToggle }) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  return (
    <div className="today-tomorrow">
      <div className="tt-intro">
        <h2 className="tt-title">Today &amp; Tomorrow</h2>
        <p className="tt-subtitle">Everyone's responsibilities at a glance</p>
      </div>
      <div className="tt-grid">
        <DaySection label="Today" dateStr={toDateStr(today)} members={members} tasks={tasks} onToggle={onToggle} />
        <DaySection label="Tomorrow" dateStr={toDateStr(tomorrow)} members={members} tasks={tasks} onToggle={onToggle} />
      </div>
    </div>
  )
}
