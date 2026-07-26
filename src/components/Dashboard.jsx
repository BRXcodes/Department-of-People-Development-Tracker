import React from 'react'
import { DAYS } from '../store'
import MemberCard from './MemberCard'
import DailyCheckin from './DailyCheckin'
import './Dashboard.css'

export default function Dashboard({ members, tasks, view, selectedDay, onToggle, onEdit, onDelete }) {
  if (view === 'daily') {
    return (
      <DailyCheckin
        members={members}
        tasks={tasks}
        day={selectedDay}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }

  const totalTasks = tasks.length
  const totalCompletions = tasks.reduce((acc, t) => {
    return acc + DAYS.filter(d => t.days.includes(d) && t.completions[d]).length
  }, 0)
  const totalPossible = tasks.reduce((acc, t) => acc + (t.days ? t.days.length : 0), 0)
  const overallPct = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0

  return (
    <div className="dashboard">
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{members.length}</span>
          <span className="stat-label">Team Members</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalTasks}</span>
          <span className="stat-label">Tasks This Week</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{overallPct}%</span>
          <span className="stat-label">Overall Completion</span>
        </div>
      </div>

      <div className="members-grid">
        {members.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            tasks={tasks.filter(t => t.memberId === member.id)}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
