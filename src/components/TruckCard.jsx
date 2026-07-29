import React, { useState } from 'react'
import './TruckCard.css'

const PRIORITY_META = {
  low:    { label: 'Low',    color: '#6B7280', bg: '#F3F4F6' },
  medium: { label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
  high:   { label: 'High',   color: '#DC2626', bg: '#FEF2F2' },
  urgent: { label: 'Urgent', color: '#7C3AED', bg: '#F5F3FF' },
}

export default function TruckCard({ member, tasks, onResolve, onEdit, onDelete, isManager }) {
  const [archiveOpen, setArchiveOpen] = useState(false)

  const open = tasks.filter(t => !t.resolved_at)
  const resolved = tasks.filter(t => t.resolved_at)

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="truck-card">
      <div className="truck-card-header">
        <div className="member-avatar" style={{ background: member.color }}>{initials}</div>
        <div className="truck-info">
          <span className="truck-name">{member.name}</span>
          <span className="truck-meta">
            {open.length} open issue{open.length !== 1 ? 's' : ''}
            {resolved.length > 0 && ` · ${resolved.length} resolved`}
          </span>
        </div>
      </div>

      <div className="truck-issues">
        {open.length === 0 && (
          <p className="no-issues">No open issues.</p>
        )}
        {open.map(task => (
          <IssueRow
            key={task.id}
            task={task}
            onResolve={onResolve}
            onEdit={onEdit}
            onDelete={onDelete}
            isManager={isManager}
            resolved={false}
          />
        ))}
      </div>

      {resolved.length > 0 && (
        <div className="truck-archive">
          <button className="archive-toggle" onClick={() => setArchiveOpen(o => !o)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: archiveOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {archiveOpen ? 'Hide' : 'Show'} {resolved.length} resolved
          </button>
          {archiveOpen && (
            <div className="archive-list">
              {resolved.map(task => (
                <IssueRow
                  key={task.id}
                  task={task}
                  onResolve={onResolve}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isManager={isManager}
                  resolved={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IssueRow({ task, onResolve, onEdit, onDelete, isManager, resolved }) {
  const p = PRIORITY_META[task.priority] || PRIORITY_META.medium

  const dueDateStr = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const isOverdue = task.due_date && !resolved && new Date(task.due_date + 'T00:00:00') < new Date()

  return (
    <div className={`issue-row ${resolved ? 'issue-resolved' : ''}`}>
      <div className="issue-row-top">
        <div className="issue-left">
          <span className="priority-badge" style={{ color: p.color, background: p.bg }}>{p.label}</span>
          <span className="issue-name">{task.name}</span>
        </div>
        <div className="issue-actions">
          {isManager && !resolved && (
            <>
              <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit issue">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className="icon-btn delete" onClick={() => onDelete(task.id)} aria-label="Delete issue">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {task.description && <p className="issue-desc">{task.description}</p>}

      <div className="issue-footer">
        {dueDateStr && (
          <span className={`issue-due ${isOverdue ? 'overdue' : ''}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {isOverdue ? 'Overdue · ' : ''}{dueDateStr}
          </span>
        )}
        {resolved && task.resolved_at && (
          <span className="issue-resolved-date">
            ✓ Resolved {new Date(task.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {isManager && (
          <button
            className={`resolve-btn ${resolved ? 'unresolve' : ''}`}
            onClick={() => onResolve(task.id, !resolved)}
          >
            {resolved ? 'Reopen' : 'Mark Resolved'}
          </button>
        )}
      </div>
    </div>
  )
}
