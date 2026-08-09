export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function getCurrentWeekLabel(startDate) {
  const start = startDate ? new Date(startDate) : getWeekStart()
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

/** Returns a map of day name -> "MM/DD" for the current week starting from startDate */
export function getCurrentWeekDates(startDate) {
  const start = startDate ? new Date(startDate) : getWeekStart()
  const dates = {}
  DAYS.forEach((name, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates[name] = `${mm}/${dd}`
  })
  return dates
}

function getWeekStart() {
  const saved = localStorage.getItem('week_start')
  if (saved) return new Date(saved)
  // Default to this week's Monday
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.getFullYear(), now.getMonth(), diff)
}

export function setWeekStart(date) {
  localStorage.setItem('week_start', date.toISOString())
}

export function getStoredWeekStart() {
  const saved = localStorage.getItem('week_start')
  return saved ? new Date(saved) : null
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
