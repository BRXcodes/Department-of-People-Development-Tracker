import React from 'react'
import { DAYS } from '../store'
import MemberCard from './MemberCard'
import TruckCard from './TruckCard'
import DailyCheckin from './DailyCheckin'
import './Dashboard.css'

export default function Dashboard({ members, tasks, view, selectedDay, onToggle, onEdit, onDelete, onResolve, isManager, isTruckTeam }) {
  if (!isTruckTeam && view === 'daily') {
    return (
      <DailyCheckin
        members={members}
        tasks={tasks}
        day={selectedDay}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        isManager={isManager}
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
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="stat-value">{members.length}</span>
          <span className="stat-label">{isTruckTeam ? 'Trucks' : 'Team Members'}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <span className="stat-value">
            {isTruckTeam ? tasks.filter(t => !t.resolved_at).length : tasks.length}
          </span>
          <span className="stat-label">{isTruckTeam ? 'Open Issues' : 'Tasks This Week'}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span className="stat-value">
            {isTruckTeam
              ? tasks.filter(t => t.resolved_at).length
              : `${totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0}%`}
          </span>
          <span className="stat-label">{isTruckTeam ? 'Resolved' : 'Overall Completion'}</span>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--gray-300)'}}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>{isTruckTeam ? 'No trucks yet.' : 'No team members yet.'}</p>
          <p>Click "{isTruckTeam ? 'Trucks' : 'Team'}" in the header to add your first {isTruckTeam ? 'truck' : 'member'}.</p>
        </div>
      ) : isTruckTeam ? (
        <div className="members-grid">
          {members.map(member => (
            <TruckCard
              key={member.id}
              member={member}
              tasks={tasks.filter(t => t.memberId === member.id)}
              onResolve={onResolve}
              onEdit={onEdit}
              onDelete={onDelete}
              isManager={isManager}
            />
          ))}
        </div>
      ) : (
        <div className="members-grid">
          {members.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              tasks={tasks.filter(t => t.memberId === member.id)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              isManager={isManager}
            />
          ))}
        </div>
      )}
    </div>
  )
}
