import React, { useState, useEffect } from 'react'
import { getInitialState, saveState, DAYS, uid, getCurrentWeekLabel } from './store'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import AssignModal from './components/AssignModal'
import MembersModal from './components/MembersModal'
import './App.css'

export default function App() {
  const [state, setState] = useState(getInitialState)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'daily'
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
  const [assignModal, setAssignModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [membersModal, setMembersModal] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  function addTask(task) {
    setState(s => ({ ...s, tasks: [...s.tasks, { ...task, id: uid(), completions: {} }] }))
  }

  function updateTask(updated) {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === updated.id ? { ...t, ...updated } : t) }))
  }

  function deleteTask(id) {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }))
  }

  function toggleComplete(taskId, day) {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => {
        if (t.id !== taskId) return t
        const completions = { ...t.completions, [day]: !t.completions[day] }
        return { ...t, completions }
      })
    }))
  }

  function updateMembers(members) {
    setState(s => ({ ...s, members }))
  }

  function resetWeek() {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => ({ ...t, completions: {} })),
      weekLabel: getCurrentWeekLabel(),
    }))
  }

  return (
    <div className="app">
      <Header
        weekLabel={state.weekLabel}
        view={view}
        setView={setView}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        onOpenAssign={() => { setEditTask(null); setAssignModal(true) }}
        onOpenMembers={() => setMembersModal(true)}
        onResetWeek={resetWeek}
      />
      <main className="main">
        <Dashboard
          members={state.members}
          tasks={state.tasks}
          view={view}
          selectedDay={selectedDay}
          onToggle={toggleComplete}
          onEdit={(task) => { setEditTask(task); setAssignModal(true) }}
          onDelete={deleteTask}
        />
      </main>
      {assignModal && (
        <AssignModal
          members={state.members}
          task={editTask}
          onSave={editTask ? updateTask : addTask}
          onClose={() => setAssignModal(false)}
        />
      )}
      {membersModal && (
        <MembersModal
          members={state.members}
          onSave={updateMembers}
          onClose={() => setMembersModal(false)}
        />
      )}
    </div>
  )
}
