const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_MEMBERS = [
  { id: '1', name: 'Team Member 1', color: '#003DA5' },
  { id: '2', name: 'Team Member 2', color: '#0055C8' },
  { id: '3', name: 'Team Member 3', color: '#1A6FD4' },
  { id: '4', name: 'Team Member 4', color: '#4CAF50' },
  { id: '5', name: 'Team Member 5', color: '#388E3C' },
  { id: '6', name: 'Team Member 6', color: '#1565C0' },
  { id: '7', name: 'Team Member 7', color: '#2E7D32' },
  { id: '8', name: 'Team Member 8', color: '#0D47A1' },
]

export { DAYS, DEFAULT_MEMBERS }

export function loadState() {
  try {
    const raw = localStorage.getItem('team-manager-state')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function saveState(state) {
  try {
    localStorage.setItem('team-manager-state', JSON.stringify(state))
  } catch {}
}

export function getInitialState() {
  const saved = loadState()
  if (saved) return saved
  return {
    members: DEFAULT_MEMBERS,
    tasks: [],
    weekLabel: getCurrentWeekLabel(),
  }
}

export function getCurrentWeekLabel() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
