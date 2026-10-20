import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './Loco.css'

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'visited', label: 'Visited' },
  { value: 'not_home', label: 'Not Home' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'closed', label: 'Closed' },
]

function statusLabel(v) {
  return STATUSES.find(s => s.value === v)?.label || v
}

function formatAppt(iso) {
  if (!iso) return 'No time set'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// Convert a stored ISO timestamp to the value a datetime-local input expects.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Loco({ isManager }) {
  const [opps, setOpps] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState('active') // active | all | visited
  const [expandedId, setExpandedId] = useState(null)

  // Add form (national CSA fields)
  const [opId, setOpId] = useState('')
  const [account, setAccount] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [address, setAddress] = useState('')
  const [appt, setAppt] = useState('')
  const [natNotes, setNatNotes] = useState('')

  useEffect(() => { loadOpps() }, [])

  async function loadOpps() {
    setLoading(true)
    const { data, error } = await supabase
      .from('loco_opportunities')
      .select('*')
      .order('appointment_at', { ascending: true, nullsFirst: false })
    if (error) console.error(error)
    setOpps(data || [])
    setLoading(false)
  }

  async function addOpp(e) {
    e.preventDefault()
    const name = account.trim()
    if (!name) return
    const id = uid()
    const row = {
      id,
      op_id: opId.trim() || null,
      account_name: name,
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      address: address.trim() || null,
      appointment_at: appt ? new Date(appt).toISOString() : null,
      national_notes: natNotes.trim() || null,
      status: 'scheduled',
      visit_notes: null,
      visited_at: null,
    }
    const { error } = await supabase.from('loco_opportunities').insert(row)
    if (error) { console.error(error); return }
    setOpps(prev => [...prev, row])
    setOpId(''); setAccount(''); setContactName(''); setContactPhone(''); setAddress(''); setAppt(''); setNatNotes('')
    setAddOpen(false)
  }

  async function updateOpp(id, patch) {
    setOpps(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
    const { error } = await supabase.from('loco_opportunities').update(patch).eq('id', id)
    if (error) console.error(error)
  }

  async function setStatus(opp, status) {
    const patch = { status }
    // Stamp the visit time the first time it moves off "scheduled".
    if (status !== 'scheduled' && !opp.visited_at) patch.visited_at = new Date().toISOString()
    updateOpp(opp.id, patch)
  }

  async function removeOpp(id) {
    const { error } = await supabase.from('loco_opportunities').delete().eq('id', id)
    if (error) { console.error(error); return }
    setOpps(prev => prev.filter(o => o.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  if (loading) {
    return <div className="loco-loading"><div className="loading-spinner" /><p>Loading opportunities...</p></div>
  }

  const visible = opps.filter(o => {
    if (filter === 'all') return true
    if (filter === 'visited') return o.status === 'visited' || o.status === 'closed'
    // active = anything not yet closed/visited
    return o.status !== 'visited' && o.status !== 'closed'
  })

  const openCount = opps.filter(o => o.status !== 'visited' && o.status !== 'closed').length

  return (
    <div className="loco">
      <div className="loco-header-row">
        <div>
          <h2 className="loco-title">LOCO</h2>
          <p className="loco-subtitle">Local Commercial · {openCount} to visit</p>
        </div>
        <button className="btn btn-primary loco-add-btn" onClick={() => setAddOpen(true)}>
          + Add
        </button>
      </div>

      <div className="loco-filters">
        <button className={`loco-pill ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
          To Visit
        </button>
        <button className={`loco-pill ${filter === 'visited' ? 'active' : ''}`} onClick={() => setFilter('visited')}>
          Done
        </button>
        <button className={`loco-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="loco-empty">
          <p>{opps.length === 0 ? 'No opportunities yet.' : 'Nothing here.'}</p>
          <p>{opps.length === 0 ? 'Tap "Add" to set one up.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="loco-list">
          {visible.map(opp => {
            const expanded = expandedId === opp.id
            return (
              <div key={opp.id} className={`loco-card status-${opp.status}`}>
                <button
                  className="loco-card-head"
                  onClick={() => setExpandedId(expanded ? null : opp.id)}
                  aria-expanded={expanded}
                >
                  <div className="loco-card-head-main">
                    <span className="loco-account">{opp.account_name}</span>
                    <span className="loco-appt">{formatAppt(opp.appointment_at)}</span>
                    {opp.op_id && <span className="loco-opid">OP {opp.op_id}</span>}
                  </div>
                  <span className={`loco-status-badge status-${opp.status}`}>{statusLabel(opp.status)}</span>
                </button>

                {expanded && (
                  <div className="loco-card-body">
                    <div className="loco-field">
                      <span className="loco-label">Contact</span>
                      {opp.contact_phone && (
                        <a className="loco-call" href={`tel:${opp.contact_phone.replace(/[^+\d]/g, '')}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {opp.contact_name ? `${opp.contact_name} · ` : ''}{opp.contact_phone}
                        </a>
                      )}
                      <div className="loco-contact-edit">
                        <input
                          className="loco-inline-input"
                          defaultValue={opp.contact_name || ''}
                          placeholder="Contact name"
                          onBlur={e => { if (e.target.value !== (opp.contact_name || '')) updateOpp(opp.id, { contact_name: e.target.value || null }) }}
                        />
                        <input
                          className="loco-inline-input"
                          type="tel"
                          inputMode="tel"
                          defaultValue={opp.contact_phone || ''}
                          placeholder="Contact phone"
                          onBlur={e => { if (e.target.value !== (opp.contact_phone || '')) updateOpp(opp.id, { contact_phone: e.target.value || null }) }}
                        />
                      </div>
                    </div>

                    <div className="loco-field">
                      <span className="loco-label">Address</span>
                      {opp.address && (
                        <a
                          className="loco-map"
                          href={`https://maps.google.com/?q=${encodeURIComponent(opp.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {opp.address}
                        </a>
                      )}
                      <input
                        className="loco-inline-input"
                        defaultValue={opp.address || ''}
                        placeholder="Job site address"
                        onBlur={e => { if (e.target.value !== (opp.address || '')) updateOpp(opp.id, { address: e.target.value || null }) }}
                      />
                    </div>

                    {opp.national_notes && (
                      <div className="loco-field">
                        <span className="loco-label">National CSA notes</span>
                        <p className="loco-national-notes">{opp.national_notes}</p>
                      </div>
                    )}

                    <div className="loco-field">
                      <span className="loco-label">Status</span>
                      <div className="loco-status-picker">
                        {STATUSES.map(s => (
                          <button
                            key={s.value}
                            className={`loco-status-choice status-${s.value} ${opp.status === s.value ? 'selected' : ''}`}
                            onClick={() => setStatus(opp, s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="loco-field">
                      <span className="loco-label">On-site notes</span>
                      <textarea
                        className="loco-textarea"
                        rows={4}
                        defaultValue={opp.visit_notes || ''}
                        placeholder="What happened on site..."
                        onBlur={e => {
                          if (e.target.value !== (opp.visit_notes || '')) {
                            updateOpp(opp.id, { visit_notes: e.target.value || null })
                          }
                        }}
                      />
                    </div>

                    {opp.visited_at && (
                      <p className="loco-visited-at">Visit logged {formatAppt(opp.visited_at)}</p>
                    )}

                    {isManager && (
                      <button className="loco-delete" onClick={() => removeOpp(opp.id)}>Delete opportunity</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal loco-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Opportunity</h2>
              <button className="modal-close" onClick={() => setAddOpen(false)}>✕</button>
            </div>
            <form onSubmit={addOpp}>
              <div className="modal-body">
                <label className="field-label">Account Name *</label>
                <input className="field-input" value={account} onChange={e => setAccount(e.target.value)} placeholder="Business / account name" autoFocus />

                <label className="field-label">OP ID</label>
                <input className="field-input" value={opId} onChange={e => setOpId(e.target.value)} placeholder="Opportunity ID" inputMode="text" />

                <label className="field-label">Contact Name</label>
                <input className="field-input" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="On-site contact" />

                <label className="field-label">Contact Phone</label>
                <input className="field-input" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="(555) 123-4567" inputMode="tel" />

                <label className="field-label">Address</label>
                <input className="field-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Job site address" />

                <label className="field-label">Appointment Date &amp; Time</label>
                <input className="field-input" type="datetime-local" value={appt} onChange={e => setAppt(e.target.value)} />

                <label className="field-label">National CSA Notes</label>
                <textarea className="field-input" rows={3} value={natNotes} onChange={e => setNatNotes(e.target.value)} placeholder="Context from the national CSA..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={!account.trim()}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
