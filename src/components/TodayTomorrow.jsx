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

function DaySection({ label, dateStr, members, tasks }) {
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
            return (
              <div key={member.id} className="tt-member">
                <div className="tt-member-header">
                  <div className="tt-avatar" style={{ background: member.color }}>{initials}</div>
                  <span className="tt-member-name">{member.name}</span>
                </div>
                <ul className="tt-task-list">
                  {mTasks.map(task => (
                    <li key={task.id} className="tt-task">
                      <span className="tt-task-name">{task.name}</span>
                      {task.description && <span className="tt-task-desc">{task.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TodayTomorrow({ members, tasks }) {
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
        <DaySection label="Today" dateStr={toDateStr(today)} members={members} tasks={tasks} />
        <DaySection label="Tomorrow" dateStr={toDateStr(tomorrow)} members={members} tasks={tasks} />
      </div>
    </div>
  )
}
