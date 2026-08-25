import React, { useState } from 'react'
import './Gauntlet.css'

// Cities grouped by direction from Salt Lake City
const CITIES_SOUTH = ['Provo', 'Lehi', 'Orem', 'American Fork', 'Pleasant Grove', 'Saratoga Springs', 'Eagle Mountain', 'Springville', 'Payson']
const CITIES_NORTH = ['Ogden', 'Layton', 'Bountiful', 'Murray', 'Park City', 'Heber City']
const CITIES_WEST = ['Tooele', 'West Jordan', 'Herriman', 'Riverton', 'South Jordan']
const CITIES_EAST = ['Sandy', 'Draper', 'Salt Lake City', 'Park City', 'Heber City']

// Combined flat list for drive time lookups
const UTAH_CITIES = [...new Set([...CITIES_SOUTH, ...CITIES_NORTH, ...CITIES_WEST, ...CITIES_EAST])]

const ITEMS = [
  'Couch', 'Mattress', 'Dresser', 'Desk', 'Bookshelf',
  'TV', 'Recliner', 'Box Spring', 'Table', 'Chairs',
  'Fridge', 'Washer', 'Dryer', 'Dishwasher', 'Microwave',
  'Tires', 'Lumber', 'Carpet', 'Hot Tub', 'Piano',
  'Bed Frame', 'Filing Cabinet', 'Entertainment Center', 'Loveseat', 'Futon',
  'Exercise Bike', 'Treadmill', 'Grill', 'Patio Set', 'Swing Set',
  'Bags of Trash', 'Yard Waste', 'Construction Debris', 'Pallets',
]

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
const ROUTE_NAMES = ['Route A', 'Route B', 'Route C', 'Route D']
const TIME_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM']

// Approximate drive times in minutes between cities (one-way)
const DRIVE_TIMES = {
  'Salt Lake City': { 'Provo': 45, 'Ogden': 35, 'Lehi': 30, 'Orem': 40, 'Sandy': 15, 'West Jordan': 15, 'Layton': 25, 'Murray': 12, 'Draper': 20, 'Bountiful': 12, 'Riverton': 20, 'Tooele': 35, 'Park City': 35, 'Springville': 50, 'American Fork': 32, 'Payson': 60, 'Heber City': 45, 'Pleasant Grove': 35, 'Saratoga Springs': 35, 'Eagle Mountain': 40, 'Herriman': 25, 'South Jordan': 20 },
  'Provo': { 'Salt Lake City': 45, 'Ogden': 70, 'Lehi': 15, 'Orem': 5, 'Sandy': 30, 'West Jordan': 30, 'Layton': 60, 'Murray': 35, 'Draper': 25, 'Bountiful': 50, 'Riverton': 28, 'Tooele': 65, 'Park City': 55, 'Springville': 8, 'American Fork': 12, 'Payson': 18, 'Heber City': 30, 'Pleasant Grove': 10, 'Saratoga Springs': 15, 'Eagle Mountain': 20, 'Herriman': 28, 'South Jordan': 28 },
  'Ogden': { 'Salt Lake City': 35, 'Provo': 70, 'Lehi': 55, 'Orem': 65, 'Sandy': 40, 'West Jordan': 40, 'Layton': 10, 'Murray': 35, 'Draper': 45, 'Bountiful': 18, 'Riverton': 45, 'Tooele': 55, 'Park City': 50, 'Springville': 75, 'American Fork': 55, 'Payson': 85, 'Heber City': 60, 'Pleasant Grove': 58, 'Saratoga Springs': 58, 'Eagle Mountain': 60, 'Herriman': 48, 'South Jordan': 42 },
  'Lehi': { 'Salt Lake City': 30, 'Provo': 15, 'Ogden': 55, 'Orem': 10, 'Sandy': 18, 'West Jordan': 15, 'Layton': 42, 'Murray': 20, 'Draper': 12, 'Bountiful': 35, 'Riverton': 12, 'Tooele': 45, 'Park City': 40, 'Springville': 20, 'American Fork': 5, 'Payson': 30, 'Heber City': 35, 'Pleasant Grove': 8, 'Saratoga Springs': 8, 'Eagle Mountain': 12, 'Herriman': 15, 'South Jordan': 12 },
  'Orem': { 'Salt Lake City': 40, 'Provo': 5, 'Ogden': 65, 'Lehi': 10, 'Sandy': 25, 'West Jordan': 25, 'Layton': 55, 'Murray': 30, 'Draper': 20, 'Bountiful': 45, 'Riverton': 22, 'Tooele': 60, 'Park City': 50, 'Springville': 10, 'American Fork': 8, 'Payson': 20, 'Heber City': 30, 'Pleasant Grove': 6, 'Saratoga Springs': 12, 'Eagle Mountain': 18, 'Herriman': 25, 'South Jordan': 22 },
  'Sandy': { 'Salt Lake City': 15, 'Provo': 30, 'Ogden': 40, 'Lehi': 18, 'Orem': 25, 'West Jordan': 10, 'Layton': 30, 'Murray': 5, 'Draper': 8, 'Bountiful': 22, 'Riverton': 10, 'Tooele': 35, 'Park City': 30, 'Springville': 35, 'American Fork': 20, 'Payson': 45, 'Heber City': 35, 'Pleasant Grove': 22, 'Saratoga Springs': 22, 'Eagle Mountain': 28, 'Herriman': 12, 'South Jordan': 8 },
  'West Jordan': { 'Salt Lake City': 15, 'Provo': 30, 'Ogden': 40, 'Lehi': 15, 'Orem': 25, 'Sandy': 10, 'Layton': 30, 'Murray': 8, 'Draper': 10, 'Bountiful': 22, 'Riverton': 5, 'Tooele': 25, 'Park City': 35, 'Springville': 35, 'American Fork': 18, 'Payson': 45, 'Heber City': 40, 'Pleasant Grove': 20, 'Saratoga Springs': 18, 'Eagle Mountain': 20, 'Herriman': 8, 'South Jordan': 5 },
  'Layton': { 'Salt Lake City': 25, 'Provo': 60, 'Ogden': 10, 'Lehi': 42, 'Orem': 55, 'Sandy': 30, 'West Jordan': 30, 'Murray': 25, 'Draper': 35, 'Bountiful': 10, 'Riverton': 32, 'Tooele': 45, 'Park City': 45, 'Springville': 62, 'American Fork': 45, 'Payson': 72, 'Heber City': 50, 'Pleasant Grove': 48, 'Saratoga Springs': 45, 'Eagle Mountain': 48, 'Herriman': 35, 'South Jordan': 32 },
  'Murray': { 'Salt Lake City': 12, 'Provo': 35, 'Ogden': 35, 'Lehi': 20, 'Orem': 30, 'Sandy': 5, 'West Jordan': 8, 'Layton': 25, 'Draper': 10, 'Bountiful': 18, 'Riverton': 10, 'Tooele': 32, 'Park City': 32, 'Springville': 40, 'American Fork': 22, 'Payson': 48, 'Heber City': 38, 'Pleasant Grove': 25, 'Saratoga Springs': 22, 'Eagle Mountain': 28, 'Herriman': 12, 'South Jordan': 10 },
  'Draper': { 'Salt Lake City': 20, 'Provo': 25, 'Ogden': 45, 'Lehi': 12, 'Orem': 20, 'Sandy': 8, 'West Jordan': 10, 'Layton': 35, 'Murray': 10, 'Bountiful': 28, 'Riverton': 8, 'Tooele': 38, 'Park City': 32, 'Springville': 28, 'American Fork': 15, 'Payson': 38, 'Heber City': 32, 'Pleasant Grove': 18, 'Saratoga Springs': 15, 'Eagle Mountain': 20, 'Herriman': 8, 'South Jordan': 5 },
  'Bountiful': { 'Salt Lake City': 12, 'Provo': 50, 'Ogden': 18, 'Lehi': 35, 'Orem': 45, 'Sandy': 22, 'West Jordan': 22, 'Layton': 10, 'Murray': 18, 'Draper': 28, 'Riverton': 25, 'Tooele': 40, 'Park City': 38, 'Springville': 55, 'American Fork': 38, 'Payson': 65, 'Heber City': 48, 'Pleasant Grove': 40, 'Saratoga Springs': 38, 'Eagle Mountain': 42, 'Herriman': 28, 'South Jordan': 25 },
  'Riverton': { 'Salt Lake City': 20, 'Provo': 28, 'Ogden': 45, 'Lehi': 12, 'Orem': 22, 'Sandy': 10, 'West Jordan': 5, 'Layton': 32, 'Murray': 10, 'Draper': 8, 'Bountiful': 25, 'Tooele': 28, 'Park City': 38, 'Springville': 30, 'American Fork': 15, 'Payson': 40, 'Heber City': 38, 'Pleasant Grove': 18, 'Saratoga Springs': 12, 'Eagle Mountain': 15, 'Herriman': 5, 'South Jordan': 5 },
  'Tooele': { 'Salt Lake City': 35, 'Provo': 65, 'Ogden': 55, 'Lehi': 45, 'Orem': 60, 'Sandy': 35, 'West Jordan': 25, 'Layton': 45, 'Murray': 32, 'Draper': 38, 'Bountiful': 40, 'Riverton': 28, 'Park City': 60, 'Springville': 68, 'American Fork': 48, 'Payson': 78, 'Heber City': 65, 'Pleasant Grove': 50, 'Saratoga Springs': 35, 'Eagle Mountain': 30, 'Herriman': 25, 'South Jordan': 28 },
  'Park City': { 'Salt Lake City': 35, 'Provo': 55, 'Ogden': 50, 'Lehi': 40, 'Orem': 50, 'Sandy': 30, 'West Jordan': 35, 'Layton': 45, 'Murray': 32, 'Draper': 32, 'Bountiful': 38, 'Riverton': 38, 'Tooele': 60, 'Springville': 55, 'American Fork': 42, 'Payson': 65, 'Heber City': 20, 'Pleasant Grove': 45, 'Saratoga Springs': 42, 'Eagle Mountain': 48, 'Herriman': 35, 'South Jordan': 32 },
  'Springville': { 'Salt Lake City': 50, 'Provo': 8, 'Ogden': 75, 'Lehi': 20, 'Orem': 10, 'Sandy': 35, 'West Jordan': 35, 'Layton': 62, 'Murray': 40, 'Draper': 28, 'Bountiful': 55, 'Riverton': 30, 'Tooele': 68, 'Park City': 55, 'American Fork': 15, 'Payson': 12, 'Heber City': 35, 'Pleasant Grove': 12, 'Saratoga Springs': 18, 'Eagle Mountain': 25, 'Herriman': 32, 'South Jordan': 30 },
  'American Fork': { 'Salt Lake City': 32, 'Provo': 12, 'Ogden': 55, 'Lehi': 5, 'Orem': 8, 'Sandy': 20, 'West Jordan': 18, 'Layton': 45, 'Murray': 22, 'Draper': 15, 'Bountiful': 38, 'Riverton': 15, 'Tooele': 48, 'Park City': 42, 'Springville': 15, 'Payson': 25, 'Heber City': 35, 'Pleasant Grove': 3, 'Saratoga Springs': 8, 'Eagle Mountain': 12, 'Herriman': 18, 'South Jordan': 15 },
  'Payson': { 'Salt Lake City': 60, 'Provo': 18, 'Ogden': 85, 'Lehi': 30, 'Orem': 20, 'Sandy': 45, 'West Jordan': 45, 'Layton': 72, 'Murray': 48, 'Draper': 38, 'Bountiful': 65, 'Riverton': 40, 'Tooele': 78, 'Park City': 65, 'Springville': 12, 'American Fork': 25, 'Heber City': 45, 'Pleasant Grove': 22, 'Saratoga Springs': 28, 'Eagle Mountain': 35, 'Herriman': 42, 'South Jordan': 40 },
  'Heber City': { 'Salt Lake City': 45, 'Provo': 30, 'Ogden': 60, 'Lehi': 35, 'Orem': 30, 'Sandy': 35, 'West Jordan': 40, 'Layton': 50, 'Murray': 38, 'Draper': 32, 'Bountiful': 48, 'Riverton': 38, 'Tooele': 65, 'Park City': 20, 'Springville': 35, 'American Fork': 35, 'Payson': 45, 'Pleasant Grove': 32, 'Saratoga Springs': 35, 'Eagle Mountain': 42, 'Herriman': 38, 'South Jordan': 35 },
  'Pleasant Grove': { 'Salt Lake City': 35, 'Provo': 10, 'Ogden': 58, 'Lehi': 8, 'Orem': 6, 'Sandy': 22, 'West Jordan': 20, 'Layton': 48, 'Murray': 25, 'Draper': 18, 'Bountiful': 40, 'Riverton': 18, 'Tooele': 50, 'Park City': 45, 'Springville': 12, 'American Fork': 3, 'Payson': 22, 'Heber City': 32, 'Saratoga Springs': 10, 'Eagle Mountain': 15, 'Herriman': 20, 'South Jordan': 18 },
  'Saratoga Springs': { 'Salt Lake City': 35, 'Provo': 15, 'Ogden': 58, 'Lehi': 8, 'Orem': 12, 'Sandy': 22, 'West Jordan': 18, 'Layton': 45, 'Murray': 22, 'Draper': 15, 'Bountiful': 38, 'Riverton': 12, 'Tooele': 35, 'Park City': 42, 'Springville': 18, 'American Fork': 8, 'Payson': 28, 'Heber City': 35, 'Pleasant Grove': 10, 'Eagle Mountain': 8, 'Herriman': 15, 'South Jordan': 15 },
  'Eagle Mountain': { 'Salt Lake City': 40, 'Provo': 20, 'Ogden': 60, 'Lehi': 12, 'Orem': 18, 'Sandy': 28, 'West Jordan': 20, 'Layton': 48, 'Murray': 28, 'Draper': 20, 'Bountiful': 42, 'Riverton': 15, 'Tooele': 30, 'Park City': 48, 'Springville': 25, 'American Fork': 12, 'Payson': 35, 'Heber City': 42, 'Pleasant Grove': 15, 'Saratoga Springs': 8, 'Herriman': 15, 'South Jordan': 18 },
  'Herriman': { 'Salt Lake City': 25, 'Provo': 28, 'Ogden': 48, 'Lehi': 15, 'Orem': 25, 'Sandy': 12, 'West Jordan': 8, 'Layton': 35, 'Murray': 12, 'Draper': 8, 'Bountiful': 28, 'Riverton': 5, 'Tooele': 25, 'Park City': 35, 'Springville': 32, 'American Fork': 18, 'Payson': 42, 'Heber City': 38, 'Pleasant Grove': 20, 'Saratoga Springs': 15, 'Eagle Mountain': 15, 'South Jordan': 5 },
  'South Jordan': { 'Salt Lake City': 20, 'Provo': 28, 'Ogden': 42, 'Lehi': 12, 'Orem': 22, 'Sandy': 8, 'West Jordan': 5, 'Layton': 32, 'Murray': 10, 'Draper': 5, 'Bountiful': 25, 'Riverton': 5, 'Tooele': 28, 'Park City': 32, 'Springville': 30, 'American Fork': 15, 'Payson': 40, 'Heber City': 35, 'Pleasant Grove': 18, 'Saratoga Springs': 15, 'Eagle Mountain': 18, 'Herriman': 5 },
}

function getDriveTime(cityA, cityB) {
  if (cityA === cityB) return 0
  return DRIVE_TIMES[cityA]?.[cityB] || DRIVE_TIMES[cityB]?.[cityA] || 30
}

function getRouteDriveTime(route) {
  if (route.length <= 1) return 0
  let total = 0
  for (let i = 0; i < route.length - 1; i++) {
    total += getDriveTime(route[i].city, route[i + 1].city)
  }
  return total
}

function formatDriveTime(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomItems() {
  const count = Math.floor(Math.random() * 4) + 1
  return shuffle(ITEMS).slice(0, count)
}

function generateRoutes() {
  // Pick 4 cities from each direction
  const south = shuffle(CITIES_SOUTH).slice(0, 4)
  const north = shuffle(CITIES_NORTH).slice(0, 4)
  const west = shuffle(CITIES_WEST).slice(0, 4)
  const east = shuffle(CITIES_EAST).slice(0, 4)

  // All 16 jobs — one per direction per time slot, then scatter across routes
  const allJobs = [...south, ...north, ...west, ...east].map((city, i) => ({
    id: `job-${Date.now()}-${i}`,
    city,
    items: randomItems(),
  }))

  // Shuffle all 16 jobs then deal into 4 routes of 4
  const shuffled = shuffle(allJobs)
  return [
    shuffled.slice(0, 4),
    shuffled.slice(4, 8),
    shuffled.slice(8, 12),
    shuffled.slice(12, 16),
  ]
}

export default function Gauntlet() {
  const [routes, setRoutes] = useState(() => generateRoutes())
  const [dragState, setDragState] = useState(null) // { routeIdx, colIdx }
  const [dropTarget, setDropTarget] = useState(null) // { routeIdx, colIdx }
  const [showTimes, setShowTimes] = useState(false)

  function reroll() {
    setRoutes(generateRoutes())
    setShowTimes(false)
  }

  function handleDragStart(e, routeIdx, colIdx) {
    setDragState({ routeIdx, colIdx })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleCardDragOver(e, routeIdx, colIdx) {
    e.preventDefault()
    // Only allow dropping in the same column (time slot is locked)
    if (dragState && dragState.colIdx === colIdx) {
      e.dataTransfer.dropEffect = 'move'
      setDropTarget({ routeIdx, colIdx })
    }
  }

  function handleDrop(e, routeIdx, colIdx) {
    e.preventDefault()
    if (!dragState || dragState.colIdx !== colIdx) {
      setDragState(null)
      setDropTarget(null)
      return
    }
    if (dragState.routeIdx === routeIdx) {
      setDragState(null)
      setDropTarget(null)
      return
    }

    // Swap the jobs between the two routes at this column
    const updated = routes.map(r => [...r])
    const temp = updated[dragState.routeIdx][colIdx]
    updated[dragState.routeIdx][colIdx] = updated[routeIdx][colIdx]
    updated[routeIdx][colIdx] = temp

    setRoutes(updated)
    setDragState(null)
    setDropTarget(null)
  }

  function handleDragEnd() {
    setDragState(null)
    setDropTarget(null)
  }

  return (
    <div className="gauntlet">
      <div className="gauntlet-header">
        <div>
          <h2 className="gauntlet-title">The Gauntlet</h2>
          <p className="gauntlet-subtitle">Swap jobs between routes to minimize drive time (columns are locked by appointment time)</p>
        </div>
        <button className="btn btn-primary" onClick={reroll}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Randomize
        </button>
      </div>

      <div className="gauntlet-actions">
        {!showTimes ? (
          <button className="btn btn-submit-routes" onClick={() => setShowTimes(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Submit Routes
          </button>
        ) : (
          <span className="gauntlet-total-time">
            Total drive time: {formatDriveTime(routes.reduce((sum, r) => sum + getRouteDriveTime(r), 0))}
          </span>
        )}
      </div>

      {/* Time slot column headers */}
      <div className="gauntlet-time-header">
        <div className="gauntlet-route-label-spacer" />
        {TIME_SLOTS.map((time, i) => (
          <div key={i} className="gauntlet-time-col-header">{time}</div>
        ))}
      </div>

      <div className="gauntlet-routes">
        {routes.map((route, routeIdx) => (
          <div key={routeIdx} className="gauntlet-route" style={{ '--route-color': ROUTE_COLORS[routeIdx] }}>
            <div className="gauntlet-route-label">
              <span className="gauntlet-route-dot" style={{ background: ROUTE_COLORS[routeIdx] }} />
              <span className="gauntlet-route-name">{ROUTE_NAMES[routeIdx]}</span>
              {showTimes && (
                <span className={`gauntlet-route-time ${getRouteDriveTime(route) > 90 ? 'over' : getRouteDriveTime(route) > 60 ? 'warn' : 'good'}`}>
                  {formatDriveTime(getRouteDriveTime(route))}
                </span>
              )}
            </div>
            <div className="gauntlet-route-slots">
              {route.map((job, colIdx) => {
                const isDragging = dragState && dragState.routeIdx === routeIdx && dragState.colIdx === colIdx
                const isDropTarget = dropTarget && dropTarget.routeIdx === routeIdx && dropTarget.colIdx === colIdx && dragState && dragState.routeIdx !== routeIdx
                return (
                  <div
                    key={job.id}
                    className={`gauntlet-card ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, routeIdx, colIdx)}
                    onDragOver={e => handleCardDragOver(e, routeIdx, colIdx)}
                    onDrop={e => handleDrop(e, routeIdx, colIdx)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="gauntlet-card-time">{TIME_SLOTS[colIdx]}</span>
                    <span className="gauntlet-card-city">{job.city}</span>
                    <span className="gauntlet-card-job">Junk Removal</span>
                    <div className="gauntlet-card-items">
                      {job.items.map((item, i) => (
                        <span key={i} className="gauntlet-card-item">{item}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
