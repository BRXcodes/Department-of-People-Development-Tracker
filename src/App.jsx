import React, { useState, useEffect } from 'react'
import { uid, getWeekStartForTeam, setWeekStartForTeam } from './store'
import { supabase } from './supabase'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Attendance from './components/Attendance'
import AssignModal from './components/AssignModal'
import TruckIssueModal from './components/TruckIssueModal'
import MembersModal from './components/MembersModal'
import NotifyModal from './components/NotifyModal'
import './App.css'

const TRUCK_TEAM_NAME = 'Truck Maintenance'

export default function App() {
  const [teams, setTeams] = useState([])
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [view, setView] = useState('dashboard')
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [assignModal, setAssignModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [membersModal, setMembersModal] = useState(false)
  const [notifyModal, setNotifyModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isManager, setIsManager] = useState(() => sessionStorage.getItem('mgr') === '1')

  // Load all data on mount
  useEffect(() => {
    loadAll()
  }, [])

  function loginManager(password) {
    if (password === import.meta.env.VITE_MANAGER_PASSWORD) {
      sessionStorage.setItem('mgr', '1')
      setIsManager(true)
      return true
    }
    return false
  }

  function logoutManager() {
    sessionStorage.removeItem('mgr')
    setIsManager(false)
  }

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [
        { data: teamsData, error: teamErr },
        { data: membersData, error: mErr },
        { data: tasksData, error: tErr },
        { data: completionsData, error: cErr },
      ] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('members').select('*').order('name'),
        supabase.from('tasks').select('*'),
        supabase.from('completions').select('*'),
      ])

      if (teamErr) throw teamErr
      if (mErr) throw mErr
      if (tErr) throw tErr
      if (cErr) throw cErr

      const tasksWithCompletions = (tasksData || []).map(t => ({
        ...t,
        memberId: t.member_id,
        completions: {},
      }))

      for (const c of completionsData || []) {
        const task = tasksWithCompletions.find(t => t.id === c.task_id)
        if (task) task.completions[c.day] = c.status || 'done'
      }

      const loadedTeams = teamsData || []
      setTeams(loadedTeams)
      setActiveTeamId(prev => {
        if (prev && loadedTeams.find(t => t.id === prev)) return prev
        return loadedTeams[0]?.id ?? null
      })
      setMembers(membersData || [])
      setTasks(tasksWithCompletions)
    } catch (err) {
      setError('Failed to load data. Check your connection.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function addTask(task) {
    const id = uid()
    const { error } = await supabase.from('tasks').insert({
      id,
      name: task.name,
      description: task.description || '',
      member_id: task.memberId,
      days: task.days,
      priority: task.priority || null,
      due_date: task.due_date || null,
      reminder_time: task.reminder_time || null,
    })
    if (error) { console.error(error); return }
    setTasks(prev => [...prev, { ...task, id, completions: {} }])
  }

  async function updateTask(updated) {
    const { error } = await supabase.from('tasks').update({
      name: updated.name,
      description: updated.description || '',
      member_id: updated.memberId,
      days: updated.days,
      priority: updated.priority || null,
      due_date: updated.due_date || null,
      reminder_time: updated.reminder_time || null,
    }).eq('id', updated.id)
    if (error) { console.error(error); return }
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { console.error(error); return }
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function toggleComplete(taskId, day) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const current = task.completions?.[day] // undefined, 'done', or 'missed'

    if (!current) {
      // neutral → done
      const { error } = await supabase.from('completions').insert({ task_id: taskId, day, status: 'done' })
      if (error) { console.error(error); return }
      setTasks(prev => prev.map(t => t.id !== taskId ? t : { ...t, completions: { ...t.completions, [day]: 'done' } }))
    } else if (current === 'done') {
      // done → missed
      const { error } = await supabase.from('completions').update({ status: 'missed' })
        .eq('task_id', taskId).eq('day', day)
      if (error) { console.error(error); return }
      setTasks(prev => prev.map(t => t.id !== taskId ? t : { ...t, completions: { ...t.completions, [day]: 'missed' } }))
    } else {
      // missed → neutral (delete)
      const { error } = await supabase.from('completions').delete()
        .eq('task_id', taskId).eq('day', day)
      if (error) { console.error(error); return }
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t
        const newCompletions = { ...t.completions }
        delete newCompletions[day]
        return { ...t, completions: newCompletions }
      }))
    }
  }

  async function updateMembers(updatedMembers) {
    // Upsert all members, delete removed ones
    const removedIds = members
      .filter(m => m.team_id === activeTeamId && !updatedMembers.find(u => u.id === m.id))
      .map(m => m.id)

    const upserts = updatedMembers.map(m => ({ id: m.id, name: m.name, color: m.color, team_id: activeTeamId }))
    const { error: uErr } = await supabase.from('members').upsert(upserts)
    if (uErr) { console.error(uErr); return }

    if (removedIds.length > 0) {
      const { error: dErr } = await supabase.from('members').delete().in('id', removedIds)
      if (dErr) { console.error(dErr); return }
    }

    setMembers(prev => [
      ...prev.filter(m => m.team_id !== activeTeamId),
      ...updatedMembers.map(m => ({ ...m, team_id: activeTeamId })),
    ])
    setTasks(prev => prev.filter(t => !removedIds.includes(t.memberId)))
  }

  async function addTeam(name) {
    const id = uid()
    const { error } = await supabase.from('teams').insert({ id, name })
    if (error) { console.error(error); return }
    setTeams(prev => [...prev, { id, name }])
    setActiveTeamId(id)
  }

  async function renameTeam(id, name) {
    const { error } = await supabase.from('teams').update({ name }).eq('id', id)
    if (error) { console.error(error); return }
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t))
  }

  async function resolveIssue(taskId, resolve) {
    const resolved_at = resolve ? new Date().toISOString() : null
    const { error } = await supabase.from('tasks').update({ resolved_at }).eq('id', taskId)
    if (error) { console.error(error); return }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, resolved_at } : t))
  }

  async function resetWeek() {
    // Only reset tasks belonging to the active team's members
    const teamMembers = members.filter(m => m.team_id === activeTeamId)
    const teamMemberIds = teamMembers.map(m => m.id)
    const teamTaskIds = tasks
      .filter(t => teamMemberIds.includes(t.memberId))
      .map(t => t.id)

    if (teamTaskIds.length === 0) return

    // Delete completions for these tasks
    const { error: cErr } = await supabase.from('completions').delete().in('task_id', teamTaskIds)
    if (cErr) { console.error(cErr); return }

    // Delete the tasks themselves
    const { error: tErr } = await supabase.from('tasks').delete().in('id', teamTaskIds)
    if (tErr) { console.error(tErr); return }

    setTasks(prev => prev.filter(t => !teamTaskIds.includes(t.id)))
    // Set week start to Monday of the current week
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.getFullYear(), now.getMonth(), diff)
    monday.setHours(0, 0, 0, 0)
    setWeekStartForTeam(activeTeamId, monday)
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-error">
        <p>{error}</p>
        <button onClick={loadAll}>Retry</button>
      </div>
    )
  }

  const activeMembers = members.filter(m => m.team_id === activeTeamId)
  const activeMemberIds = new Set(activeMembers.map(m => m.id))
  const activeTasks = tasks.filter(t => activeMemberIds.has(t.memberId))
  const activeTeam = teams.find(t => t.id === activeTeamId)
  const isTruckTeam = activeTeam?.name === TRUCK_TEAM_NAME

  return (
    <div className="app">
      <Header
        view={view}
        setView={setView}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        onOpenAssign={() => { setEditTask(null); setAssignModal(true) }}
        onOpenMembers={() => setMembersModal(true)}
        onOpenNotify={() => setNotifyModal(true)}
        onResetWeek={resetWeek}
        isManager={isManager}
        onLogin={loginManager}
        onLogout={logoutManager}
        teams={teams}
        activeTeamId={activeTeamId}
        onSelectTeam={setActiveTeamId}
        onAddTeam={addTeam}
        onRenameTeam={renameTeam}
        isTruckTeam={isTruckTeam}
        weekStart={getWeekStartForTeam(activeTeamId)}
      />
      <main className="main">
        {view === 'attendance' ? (
          <Attendance isManager={isManager} />
        ) : (
          <Dashboard
            members={activeMembers}
            tasks={activeTasks}
            view={view}
            selectedDay={selectedDay}
            onToggle={toggleComplete}
            onEdit={(task) => { setEditTask(task); setAssignModal(true) }}
            onDelete={deleteTask}
            onResolve={resolveIssue}
            isManager={isManager}
            isTruckTeam={isTruckTeam}
          />
        )}
      </main>
      {assignModal && (
        isTruckTeam ? (
          <TruckIssueModal
            members={activeMembers}
            task={editTask}
            onSave={editTask ? updateTask : addTask}
            onClose={() => setAssignModal(false)}
          />
        ) : (
          <AssignModal
            members={activeMembers}
            task={editTask}
            onSave={editTask ? updateTask : addTask}
            onClose={() => setAssignModal(false)}
            weekStart={getWeekStartForTeam(activeTeamId)}
          />
        )
      )}
      {membersModal && (
        <MembersModal
          members={activeMembers}
          onSave={updateMembers}
          onClose={() => setMembersModal(false)}
        />
      )}
      {notifyModal && (
        <NotifyModal
          members={(() => {
            const truckTeamId = teams.find(t => t.name === TRUCK_TEAM_NAME)?.id
            const nonTruck = members.filter(m => m.team_id !== truckTeamId)
            const seen = new Set()
            return nonTruck.filter(m => {
              if (seen.has(m.name)) return false
              seen.add(m.name)
              return true
            })
          })()}
          onClose={() => setNotifyModal(false)}
        />
      )}
    </div>
  )
}
