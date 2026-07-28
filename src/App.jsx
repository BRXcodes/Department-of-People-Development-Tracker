import React, { useState, useEffect } from 'react'
import { DAYS, uid, getCurrentWeekLabel } from './store'
import { supabase } from './supabase'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import AssignModal from './components/AssignModal'
import MembersModal from './components/MembersModal'
import './App.css'

export default function App() {
  const [teams, setTeams] = useState([])
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [weekLabel, setWeekLabel] = useState(getCurrentWeekLabel())
  const [view, setView] = useState('dashboard')
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
  const [assignModal, setAssignModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [membersModal, setMembersModal] = useState(false)
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
        if (task) task.completions[c.day] = true
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
    const isDone = task.completions?.[day]

    if (isDone) {
      const { error } = await supabase.from('completions').delete()
        .eq('task_id', taskId).eq('day', day)
      if (error) { console.error(error); return }
    } else {
      const { error } = await supabase.from('completions').insert({ task_id: taskId, day })
      if (error) { console.error(error); return }
    }

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return { ...t, completions: { ...t.completions, [day]: !isDone } }
    }))
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

  async function resetWeek() {
    const { error } = await supabase.from('completions').delete().neq('task_id', '')
    if (error) { console.error(error); return }
    setTasks(prev => prev.map(t => ({ ...t, completions: {} })))
    setWeekLabel(getCurrentWeekLabel())
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

  return (
    <div className="app">
      <Header
        weekLabel={weekLabel}
        view={view}
        setView={setView}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        onOpenAssign={() => { setEditTask(null); setAssignModal(true) }}
        onOpenMembers={() => setMembersModal(true)}
        onResetWeek={resetWeek}
        isManager={isManager}
        onLogin={loginManager}
        onLogout={logoutManager}
        teams={teams}
        activeTeamId={activeTeamId}
        onSelectTeam={setActiveTeamId}
        onAddTeam={addTeam}
        onRenameTeam={renameTeam}
      />
      <main className="main">
        <Dashboard
          members={activeMembers}
          tasks={activeTasks}
          view={view}
          selectedDay={selectedDay}
          onToggle={toggleComplete}
          onEdit={(task) => { setEditTask(task); setAssignModal(true) }}
          onDelete={deleteTask}
          isManager={isManager}
        />
      </main>
      {assignModal && (
        <AssignModal
          members={activeMembers}
          task={editTask}
          onSave={editTask ? updateTask : addTask}
          onClose={() => setAssignModal(false)}
        />
      )}
      {membersModal && (
        <MembersModal
          members={activeMembers}
          onSave={updateMembers}
          onClose={() => setMembersModal(false)}
        />
      )}
    </div>
  )
}
