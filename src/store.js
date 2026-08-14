export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function getCurrentWeekLabel(startDate) {
  const start = startDate ? new Date(startDate) : getDefaultWeekStart()
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

/** Returns a map of day name -> "MM/DD" for the week starting from startDate */
export function getCurrentWeekDates(startDate) {
  const start = startDate ? new Date(startDate) : getDefaultWeekStart()
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

function getDefaultWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.getFullYear(), now.getMonth(), diff)
}

export function getWeekStartForTeam(teamId) {
  const saved = localStorage.getItem(`week_start_${teamId}`)
  if (saved) {
    const date = new Date(saved)
    // Normalize to Monday of that week in case a non-Monday was stored
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.getFullYear(), date.getMonth(), diff)
  }
  return getDefaultWeekStart()
}

export function setWeekStartForTeam(teamId, date) {
  localStorage.setItem(`week_start_${teamId}`, date.toISOString())
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
