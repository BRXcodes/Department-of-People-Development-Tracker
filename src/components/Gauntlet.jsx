import React, { useState, useRef } from 'react'
import './Gauntlet.css'

// Cities grouped by direction from Salt Lake City
const CITIES_SOUTH = ['Provo', 'Lehi', 'Orem', 'American Fork', 'Pleasant Grove', 'Saratoga Springs', 'Eagle Mountain', 'Springville', 'Payson']
const CITIES_NORTH = ['Ogden', 'Layton', 'Bountiful', 'Murray', 'Park City', 'Heber City']
const CITIES_WEST = ['Tooele', 'West Jordan', 'Herriman', 'Riverton', 'South Jordan']
const CITIES_EAST = ['Sandy', 'Draper', 'Salt Lake City', 'Park City', 'Heber City']

const ITEMS = [
  'Couch', 'Mattress', 'Dresser', 'Desk', 'Bookshelf',
  'TV', 'Recliner', 'Box Spring', 'Table', 'Chairs',
  'Fridge', 'Washer', 'Dryer', 'Dishwasher', 'Microwave',
  'Tires', 'Lumber', 'Carpet', 'Hot Tub', 'Piano',
  'Bed Frame', 'Filing Cabinet', 'Entertainment Center', 'Loveseat', 'Futon',
  'Exercise Bike', 'Treadmill', 'Grill', 'Patio Set', 'Swing Set',
  'Bags of Trash', 'Yard Waste', 'Construction Debris', 'Pallets',
]

const NOTES = [
  'Call 15 min before', 'Gate code: 1234', 'Around back', 'Upstairs unit',
  'Customer will help load', 'Narrow driveway', 'Dog in yard - call first',
  'Items in garage', 'Second floor no elevator', 'Ring doorbell twice',
  'Basement access only', 'Use side gate', 'Heavy items - 2 person',
  'Customer not home - items on curb', 'Gated community - wait for entry',
]

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
const ROUTE_NAMES = ['Route A', 'Route B', 'Route C', 'Route D']
const TIME_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM']
const ALL_TIME_WINDOWS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM']

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

function randomNote() {
  return shuffle(NOTES)[0]
}

// ==================== LEVEL 1: Cities only ====================
function generateLevel1() {
  const south = shuffle(CITIES_SOUTH).slice(0, 4)
  const north = shuffle(CITIES_NORTH).slice(0, 4)
  const west = shuffle(CITIES_WEST).slice(0, 4)
  const east = shuffle(CITIES_EAST).slice(0, 4)
  const directions = [south, north, west, east]
  const shuffledDirs = directions.map(d => shuffle(d))
  const routes = [[], [], [], []]
  for (let col = 0; col < 4; col++) {
    const columnJobs = shuffledDirs.map((dir, dirIdx) => ({
      id: `job-${Date.now()}-${col * 4 + dirIdx}-${Math.random()}`,
      city: dir[col],
    }))
    const shuffledCol = shuffle(columnJobs)
    for (let row = 0; row < 4; row++) {
      routes[row].push(shuffledCol[row])
    }
  }
  return routes
}

// ==================== LEVEL 2: Current (cities + items) ====================
function generateLevel2() {
  const south = shuffle(CITIES_SOUTH).slice(0, 4)
  const north = shuffle(CITIES_NORTH).slice(0, 4)
  const west = shuffle(CITIES_WEST).slice(0, 4)
  const east = shuffle(CITIES_EAST).slice(0, 4)
  const directions = [south, north, west, east]
  const shuffledDirs = directions.map(d => shuffle(d))
  const routes = [[], [], [], []]
  for (let col = 0; col < 4; col++) {
    const columnJobs = shuffledDirs.map((dir, dirIdx) => ({
      id: `job-${Date.now()}-${col * 4 + dirIdx}-${Math.random()}`,
      city: dir[col],
      items: randomItems(),
    }))
    const shuffledCol = shuffle(columnJobs)
    for (let row = 0; row < 4; row++) {
      routes[row].push(shuffledCol[row])
    }
  }
  return routes
}

// ==================== LEVEL 3: Advanced (build routes from pool) ====================
function generateLevel3() {
  const allCities = shuffle([...new Set([...CITIES_SOUTH, ...CITIES_NORTH, ...CITIES_WEST, ...CITIES_EAST])])
  const selectedCities = allCities.slice(0, 16)

  const allJobs = selectedCities.map((city, i) => ({
    id: `job-${Date.now()}-${i}-${Math.random()}`,
    city,
    items: randomItems(),
    note: randomNote(),
    timeWindow: shuffle(ALL_TIME_WINDOWS)[0],
  }))

  // First 4 jobs go into routes (one per route), rest go to pool
  const shuffled = shuffle(allJobs)
  const routes = shuffled.slice(0, 4).map(j => [j])
  const pool = shuffled.slice(4)

  return { routes, pool }
}

export default function Gauntlet() {
  const [level, setLevel] = useState(1)
  const [routes, setRoutes] = useState(() => generateLevel1())
  const [pool, setPool] = useState([]) // Level 3 only
  const [dragState, setDragState] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [showTimes, setShowTimes] = useState(false)
  const initialState = useRef({ routes: generateLevel1(), pool: [] })

  function switchLevel(newLevel) {
    setLevel(newLevel)
    setShowTimes(false)
    setDragState(null)
    setDropTarget(null)
    let newRoutes, newPool = []
    if (newLevel === 1) { newRoutes = generateLevel1() }
    else if (newLevel === 2) { newRoutes = generateLevel2() }
    else { const data = generateLevel3(); newRoutes = data.routes; newPool = data.pool }
    setRoutes(newRoutes)
    setPool(newPool)
    initialState.current = { routes: JSON.parse(JSON.stringify(newRoutes)), pool: JSON.parse(JSON.stringify(newPool)) }
  }

  function reroll() {
    setShowTimes(false)
    setDragState(null)
    setDropTarget(null)
    let newRoutes, newPool = []
    if (level === 1) { newRoutes = generateLevel1() }
    else if (level === 2) { newRoutes = generateLevel2() }
    else { const data = generateLevel3(); newRoutes = data.routes; newPool = data.pool }
    setRoutes(newRoutes)
    setPool(newPool)
    initialState.current = { routes: JSON.parse(JSON.stringify(newRoutes)), pool: JSON.parse(JSON.stringify(newPool)) }
  }

  function resetToInitial() {
    setShowTimes(false)
    setDragState(null)
    setDropTarget(null)
    setRoutes(JSON.parse(JSON.stringify(initialState.current.routes)))
    setPool(JSON.parse(JSON.stringify(initialState.current.pool)))
  }

  // ===== Level 1 & 2 drag: swap within same column =====
  function handleSwapDragStart(e, routeIdx, colIdx) {
    setDragState({ type: 'swap', routeIdx, colIdx })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleSwapDragOver(e, routeIdx, colIdx) {
    e.preventDefault()
    if (dragState && dragState.type === 'swap' && dragState.colIdx === colIdx) {
      e.dataTransfer.dropEffect = 'move'
      setDropTarget({ routeIdx, colIdx })
    }
  }

  function handleSwapDrop(e, routeIdx, colIdx) {
    e.preventDefault()
    if (!dragState || dragState.type !== 'swap' || dragState.colIdx !== colIdx || dragState.routeIdx === routeIdx) {
      setDragState(null); setDropTarget(null); return
    }
    const updated = routes.map(r => [...r])
    const temp = updated[dragState.routeIdx][colIdx]
    updated[dragState.routeIdx][colIdx] = updated[routeIdx][colIdx]
    updated[routeIdx][colIdx] = temp
    setRoutes(updated)
    setDragState(null); setDropTarget(null)
  }

  // ===== Level 3 drag: from pool to route or reorder within routes =====
  function handlePoolDragStart(e, poolIdx) {
    setDragState({ type: 'pool', poolIdx })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleRouteDragStartL3(e, routeIdx, jobIdx) {
    setDragState({ type: 'route', routeIdx, jobIdx })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleRouteDropL3(e, routeIdx, insertIdx) {
    e.preventDefault()
    if (!dragState) { setDropTarget(null); return }

    if (dragState.type === 'pool') {
      const job = pool[dragState.poolIdx]
      const newPool = [...pool]
      newPool.splice(dragState.poolIdx, 1)
      const updated = routes.map(r => [...r])
      updated[routeIdx].splice(insertIdx, 0, job)
      setRoutes(updated)
      setPool(newPool)
    } else if (dragState.type === 'route') {
      const updated = routes.map(r => [...r])
      const [dragged] = updated[dragState.routeIdx].splice(dragState.jobIdx, 1)
      let finalIdx = insertIdx
      if (dragState.routeIdx === routeIdx && dragState.jobIdx < insertIdx) finalIdx--
      updated[routeIdx].splice(finalIdx, 0, dragged)
      setRoutes(updated)
    }
    setDragState(null); setDropTarget(null)
  }

  function handleRouteJobBackToPool(e, routeIdx, jobIdx) {
    e.preventDefault()
    const updated = routes.map(r => [...r])
    const [job] = updated[routeIdx].splice(jobIdx, 1)
    setRoutes(updated)
    setPool(prev => [...prev, job])
  }

  function handleDragEnd() {
    setDragState(null); setDropTarget(null)
  }

  const totalDriveTime = routes.reduce((sum, r) => sum + getRouteDriveTime(r), 0)

  return (
    <div className="gauntlet">
      <div className="gauntlet-header">
        <div>
          <h2 className="gauntlet-title">The Gauntlet</h2>
          <p className="gauntlet-subtitle">
            {level === 1 && 'Swap jobs between routes to minimize drive time'}
            {level === 2 && 'Swap jobs between routes — columns locked by appointment time'}
            {level === 3 && 'Build efficient routes by dragging jobs from the pool'}
          </p>
        </div>
        <div className="gauntlet-header-btns">
          <button className="btn btn-reset-gauntlet" onClick={resetToInitial} title="Reset to starting positions for another attempt">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Reset
          </button>
          <button className="btn btn-primary" onClick={reroll}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Randomize
          </button>
        </div>
      </div>

      {/* Level selector */}
      <div className="gauntlet-levels">
        <button className={`gauntlet-level-btn ${level === 1 ? 'active' : ''}`} onClick={() => switchLevel(1)}>
          Level 1 <span className="gauntlet-level-desc">Drive Time</span>
        </button>
        <button className={`gauntlet-level-btn ${level === 2 ? 'active' : ''}`} onClick={() => switchLevel(2)}>
          Level 2 <span className="gauntlet-level-desc">+ Items</span>
        </button>
        <button className={`gauntlet-level-btn ${level === 3 ? 'active' : ''}`} onClick={() => switchLevel(3)}>
          Level 3 <span className="gauntlet-level-desc">Advanced</span>
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
            Total drive time: {formatDriveTime(totalDriveTime)}
          </span>
        )}
      </div>

      {/* ===== LEVEL 1 & 2 ===== */}
      {(level === 1 || level === 2) && (
        <>
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
                    const isDragging = dragState && dragState.type === 'swap' && dragState.routeIdx === routeIdx && dragState.colIdx === colIdx
                    const isTarget = dropTarget && dropTarget.routeIdx === routeIdx && dropTarget.colIdx === colIdx && dragState && dragState.routeIdx !== routeIdx
                    return (
                      <div
                        key={job.id}
                        className={`gauntlet-card ${isDragging ? 'dragging' : ''} ${isTarget ? 'drop-target' : ''}`}
                        draggable
                        onDragStart={e => handleSwapDragStart(e, routeIdx, colIdx)}
                        onDragOver={e => handleSwapDragOver(e, routeIdx, colIdx)}
                        onDrop={e => handleSwapDrop(e, routeIdx, colIdx)}
                        onDragEnd={handleDragEnd}
                      >
                        <span className="gauntlet-card-time">{TIME_SLOTS[colIdx]}</span>
                        <span className="gauntlet-card-city">{job.city}</span>
                        {level === 2 && (
                          <div className="gauntlet-card-items">
                            {job.items.map((item, i) => (
                              <span key={i} className="gauntlet-card-item">{item}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== LEVEL 3 ===== */}
      {level === 3 && (
        <>
          <div className="gauntlet-routes gauntlet-routes-l3">
            {routes.map((route, routeIdx) => (
              <div key={routeIdx} className="gauntlet-route-l3" style={{ '--route-color': ROUTE_COLORS[routeIdx] }}>
                <div className="gauntlet-route-label">
                  <span className="gauntlet-route-dot" style={{ background: ROUTE_COLORS[routeIdx] }} />
                  <span className="gauntlet-route-name">{ROUTE_NAMES[routeIdx]}</span>
                  <span className="gauntlet-route-count">{route.length} stops</span>
                  {showTimes && (
                    <span className={`gauntlet-route-time ${getRouteDriveTime(route) > 90 ? 'over' : getRouteDriveTime(route) > 60 ? 'warn' : 'good'}`}>
                      {formatDriveTime(getRouteDriveTime(route))}
                    </span>
                  )}
                </div>
                <div
                  className="gauntlet-route-jobs-l3"
                  onDragOver={e => { e.preventDefault(); setDropTarget({ routeIdx, position: route.length }) }}
                  onDrop={e => handleRouteDropL3(e, routeIdx, route.length)}
                >
                  {route.map((job, jobIdx) => (
                    <div
                      key={job.id}
                      className={`gauntlet-card-l3 ${dragState && dragState.type === 'route' && dragState.routeIdx === routeIdx && dragState.jobIdx === jobIdx ? 'dragging' : ''}`}
                      draggable
                      onDragStart={e => handleRouteDragStartL3(e, routeIdx, jobIdx)}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropTarget({ routeIdx, position: jobIdx }) }}
                      onDrop={e => { e.stopPropagation(); handleRouteDropL3(e, routeIdx, jobIdx) }}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={e => handleRouteJobBackToPool(e, routeIdx, jobIdx)}
                    >
                      <span className="gauntlet-card-time">{job.timeWindow}</span>
                      <span className="gauntlet-card-city">{job.city}</span>
                      <div className="gauntlet-card-items">
                        {job.items.map((item, i) => (
                          <span key={i} className="gauntlet-card-item">{item}</span>
                        ))}
                      </div>
                      {job.note && <span className="gauntlet-card-note">{job.note}</span>}
                    </div>
                  ))}
                  {route.length === 0 && (
                    <div className="gauntlet-empty-route">Drop jobs here</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Job Pool */}
          <div className="gauntlet-pool">
            <div className="gauntlet-pool-header">
              <span className="gauntlet-pool-title">Unassigned Jobs</span>
              <span className="gauntlet-pool-count">{pool.length} remaining</span>
            </div>
            <div className="gauntlet-pool-grid">
              {pool.map((job, poolIdx) => (
                <div
                  key={job.id}
                  className="gauntlet-card-l3 pool-card"
                  draggable
                  onDragStart={e => handlePoolDragStart(e, poolIdx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="gauntlet-card-time">{job.timeWindow}</span>
                  <span className="gauntlet-card-city">{job.city}</span>
                  <div className="gauntlet-card-items">
                    {job.items.map((item, i) => (
                      <span key={i} className="gauntlet-card-item">{item}</span>
                    ))}
                  </div>
                  {job.note && <span className="gauntlet-card-note">{job.note}</span>}
                </div>
              ))}
              {pool.length === 0 && (
                <div className="gauntlet-pool-empty">All jobs assigned! Double-click a job on a route to send it back.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
