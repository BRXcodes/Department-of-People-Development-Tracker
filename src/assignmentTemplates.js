// Assignment templates for common People Development tasks.
// Templates pre-fill the task name and description in the Assign Task modal.
// All templates (built-in defaults and custom ones) can be edited in-app.
//
// Storage model (localStorage key below):
//   {
//     overrides: { [id]: { label, name, description } },  // edits applied over any template
//     custom:    [ { id, label, name, description } ],     // manager-created templates
//     hidden:    [ id, ... ]                               // ids removed from the list
//   }
// Built-in defaults are never mutated; deleting one just hides it, so it can be restored.

const STORAGE_KEY = 'assignment_templates_v1'

// Built-in templates. These always exist unless hidden, and can be edited via overrides.
export const DEFAULT_TEMPLATES = [
  {
    id: 'scenario',
    label: 'Scenario',
    name: 'Run Scenario',
    description: 'Run the assigned scenario end to end, then debrief on what went well and one thing to sharpen for next time.',
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    name: 'Whiteboard Session',
    description: 'Have the team member whiteboard the pitch/process from memory. Correct gaps on the spot and confirm they can teach it back.',
  },
  {
    id: 'ride-along',
    label: 'Ride-Along',
    name: 'Ride-Along',
    description: 'Shadow the team member for a full shift. Take notes without interrupting, then give one strength and one focus area in the debrief.',
  },
  {
    id: 'roleplay',
    label: 'Role-Play',
    name: 'Role-Play',
    description: 'Run through objection handling and the close as a role-play. Rotate roles so they both deliver and hear the pitch.',
  },
  {
    id: 'product-quiz',
    label: 'Product Quiz',
    name: 'Product Knowledge Quiz',
    description: 'Quiz the team member on product details and pricing. Log the score and reassign any topics they miss.',
  },
  {
    id: 'one-on-one',
    label: '1-on-1',
    name: '1-on-1 Check-in',
    description: 'Sit down one-on-one to review goals, blockers, and progress since last week. End with one clear action item.',
  },
  {
    id: 'observation',
    label: 'Observation',
    name: 'Live Observation',
    description: 'Observe the team member live and complete the observation scorecard. Share the results and set a target for next time.',
  },
]

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { overrides: {}, custom: [], hidden: [] }
    const parsed = JSON.parse(raw)
    return {
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    }
  } catch {
    return { overrides: {}, custom: [], hidden: [] }
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

/**
 * Returns all visible templates: built-in defaults first (with any edits applied),
 * then custom ones. Each has { id, label, name, description, custom }.
 */
export function getTemplates() {
  const { overrides, custom, hidden } = loadStore()
  const hiddenSet = new Set(hidden)

  const builtins = DEFAULT_TEMPLATES
    .filter(t => !hiddenSet.has(t.id))
    .map(t => ({ ...t, ...overrides[t.id], id: t.id, custom: false }))

  const customs = custom
    .filter(t => !hiddenSet.has(t.id))
    .map(t => ({ ...t, ...overrides[t.id], id: t.id, custom: true }))

  return [...builtins, ...customs]
}

/** Adds a custom template and returns the full updated list. */
export function addTemplate({ label, name, description }) {
  const store = loadStore()
  const template = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: label.trim(),
    name: (name || label).trim(),
    description: (description || '').trim(),
  }
  store.custom = [...store.custom, template]
  saveStore(store)
  return getTemplates()
}

/**
 * Edits any template (built-in or custom). Built-in edits are stored as overrides;
 * custom edits update the custom entry directly. Returns the full updated list.
 */
export function updateTemplate(id, { label, name, description }) {
  const store = loadStore()
  const patch = {
    label: label.trim(),
    name: (name || label).trim(),
    description: (description || '').trim(),
  }

  const customIndex = store.custom.findIndex(t => t.id === id)
  if (customIndex >= 0) {
    store.custom = store.custom.map(t => t.id === id ? { ...t, ...patch } : t)
  } else {
    // built-in: store as an override
    store.overrides = { ...store.overrides, [id]: patch }
  }
  saveStore(store)
  return getTemplates()
}

/**
 * Removes a template. Custom templates are deleted outright; built-ins are hidden
 * (and can be restored via resetTemplate). Returns the full updated list.
 */
export function removeTemplate(id) {
  const store = loadStore()
  const isCustom = store.custom.some(t => t.id === id)
  if (isCustom) {
    store.custom = store.custom.filter(t => t.id !== id)
    delete store.overrides[id]
  } else {
    if (!store.hidden.includes(id)) store.hidden = [...store.hidden, id]
  }
  saveStore(store)
  return getTemplates()
}

/** Restores a built-in template to its default and unhides it. Returns the updated list. */
export function resetTemplate(id) {
  const store = loadStore()
  store.hidden = store.hidden.filter(h => h !== id)
  delete store.overrides[id]
  saveStore(store)
  return getTemplates()
}

/** True if the given built-in id has been edited or hidden. */
export function isBuiltinModified(id) {
  const { overrides, hidden } = loadStore()
  return Boolean(overrides[id]) || hidden.includes(id)
}

/** Number of built-in templates currently hidden (deleted). */
export function hiddenBuiltinCount() {
  const { hidden } = loadStore()
  const builtinIds = new Set(DEFAULT_TEMPLATES.map(t => t.id))
  return hidden.filter(id => builtinIds.has(id)).length
}

/** Unhides all hidden built-in templates (keeps any edits). Returns the updated list. */
export function restoreHiddenBuiltins() {
  const store = loadStore()
  const builtinIds = new Set(DEFAULT_TEMPLATES.map(t => t.id))
  store.hidden = store.hidden.filter(id => !builtinIds.has(id))
  saveStore(store)
  return getTemplates()
}
