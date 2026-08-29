import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { uid } from '../store'
import './ShopManagement.css'

const CATEGORIES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'issue', label: 'Issue' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'kudos', label: 'Kudos' },
]

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'done', label: 'Done' },
  { value: 'declined', label: 'Declined' },
]

function categoryLabel(v) {
  return CATEGORIES.find(c => c.value === v)?.label || v
}

function statusLabel(v) {
  return STATUSES.find(s => s.value === v)?.label || v
}

function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Track which posts this browser has upvoted so the same person can't spam it.
function getVotedSet() {
  try {
    const raw = localStorage.getItem('shop_upvotes')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveVotedSet(set) {
  try {
    localStorage.setItem('shop_upvotes', JSON.stringify([...set]))
  } catch {
    // ignore
  }
}

export default function ShopManagement({ isManager }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [voted, setVoted] = useState(() => getVotedSet())

  // New post form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('suggestion')
  const [author, setAuthor] = useState('')

  // Manager note editing
  const [noteEditId, setNoteEditId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('shop_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setPosts(data || [])
    setLoading(false)
  }

  async function submitPost(e) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    const id = uid()
    const post = {
      id,
      title: t,
      body: body.trim() || null,
      category,
      author: author.trim() || null,
      status: 'new',
      pinned: false,
      upvotes: 0,
      manager_note: null,
    }
    const { error } = await supabase.from('shop_posts').insert(post)
    if (error) { console.error(error); return }
    setPosts(prev => [{ ...post, created_at: new Date().toISOString() }, ...prev])
    setTitle('')
    setBody('')
    setCategory('suggestion')
    setAuthor('')
    setAddModal(false)
  }

  async function toggleUpvote(post) {
    const hasVoted = voted.has(post.id)
    const delta = hasVoted ? -1 : 1
    const newCount = Math.max(0, (post.upvotes || 0) + delta)
    const { error } = await supabase.from('shop_posts').update({ upvotes: newCount }).eq('id', post.id)
    if (error) { console.error(error); return }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, upvotes: newCount } : p))
    const next = new Set(voted)
    if (hasVoted) next.delete(post.id); else next.add(post.id)
    setVoted(next)
    saveVotedSet(next)
  }

  async function setStatus(id, status) {
    const { error } = await supabase.from('shop_posts').update({ status }).eq('id', id)
    if (error) { console.error(error); return }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  async function togglePin(post) {
    const pinned = !post.pinned
    const { error } = await supabase.from('shop_posts').update({ pinned }).eq('id', post.id)
    if (error) { console.error(error); return }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned } : p))
  }

  async function saveNote(id) {
    const note = noteDraft.trim() || null
    const { error } = await supabase.from('shop_posts').update({ manager_note: note }).eq('id', id)
    if (error) { console.error(error); return }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, manager_note: note } : p))
    setNoteEditId(null)
    setNoteDraft('')
  }

  async function removePost(id) {
    const { error } = await supabase.from('shop_posts').delete().eq('id', id)
    if (error) { console.error(error); return }
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const filtered = posts
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => filterCategory === 'all' || p.category === filterCategory)
    .sort((a, b) => {
      // Pinned first, then by upvotes, then newest
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
      if ((b.upvotes || 0) !== (a.upvotes || 0)) return (b.upvotes || 0) - (a.upvotes || 0)
      return (b.created_at || '').localeCompare(a.created_at || '')
    })

  const openCount = posts.filter(p => p.status === 'new' || p.status === 'reviewing').length

  if (loading) {
    return <div className="shop-loading"><div className="loading-spinner" /><p>Loading board...</p></div>
  }

  return (
    <div className="shop-management">
      <div className="shop-header-row">
        <div>
          <h2 className="shop-title">Shop Management</h2>
          <p className="shop-subtitle">
            Feedback &amp; suggestions for Keaton · {openCount} open
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Post Suggestion
        </button>
      </div>

      {/* Filters */}
      <div className="shop-filters">
        <div className="shop-filter-row">
          <button className={`shop-pill ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
            All ({posts.length})
          </button>
          {STATUSES.map(s => {
            const count = posts.filter(p => p.status === s.value).length
            return (
              <button
                key={s.value}
                className={`shop-pill status-${s.value} ${filterStatus === s.value ? 'active' : ''}`}
                onClick={() => setFilterStatus(f => f === s.value ? 'all' : s.value)}
              >
                {s.label} ({count})
              </button>
            )
          })}
        </div>
        <div className="shop-filter-row">
          <button className={`shop-pill ${filterCategory === 'all' ? 'active' : ''}`} onClick={() => setFilterCategory('all')}>
            All Types
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`shop-pill cat-${c.value} ${filterCategory === c.value ? 'active' : ''}`}
              onClick={() => setFilterCategory(f => f === c.value ? 'all' : c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="shop-board">
        {filtered.length === 0 && (
          <div className="shop-empty">
            {posts.length === 0 ? (
              <>
                <p>The board is empty.</p>
                <p>Be the first to post a suggestion for the shop.</p>
              </>
            ) : (
              <p>No posts match the current filters.</p>
            )}
          </div>
        )}
        {filtered.map(post => (
          <div key={post.id} className={`shop-card status-${post.status} ${post.pinned ? 'pinned' : ''}`}>
            <div className="shop-card-vote">
              <button
                className={`shop-vote-btn ${voted.has(post.id) ? 'voted' : ''}`}
                onClick={() => toggleUpvote(post)}
                aria-label="Upvote"
                title={voted.has(post.id) ? 'Remove upvote' : 'Upvote'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </button>
              <span className="shop-vote-count">{post.upvotes || 0}</span>
            </div>

            <div className="shop-card-main">
              <div className="shop-card-top">
                <span className={`shop-cat-badge cat-${post.category}`}>{categoryLabel(post.category)}</span>
                <span className={`shop-status-badge status-${post.status}`}>{statusLabel(post.status)}</span>
                {post.pinned && <span className="shop-pin-badge">Pinned</span>}
              </div>

              <h3 className="shop-card-title">{post.title}</h3>
              {post.body && <p className="shop-card-body">{post.body}</p>}

              <div className="shop-card-meta">
                <span>{post.author ? post.author : 'Anonymous'}</span>
                <span className="shop-dot">·</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>

              {post.manager_note && noteEditId !== post.id && (
                <div className="shop-manager-note">
                  <span className="shop-manager-note-label">Keaton</span>
                  <p>{post.manager_note}</p>
                </div>
              )}

              {isManager && (
                <div className="shop-card-actions">
                  <select
                    className="shop-status-select"
                    value={post.status}
                    onChange={e => setStatus(post.id, e.target.value)}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button className="shop-action-btn" onClick={() => togglePin(post)}>
                    {post.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    className="shop-action-btn"
                    onClick={() => { setNoteEditId(post.id); setNoteDraft(post.manager_note || '') }}
                  >
                    {post.manager_note ? 'Edit reply' : 'Reply'}
                  </button>
                  <button className="shop-action-btn danger" onClick={() => removePost(post.id)}>Delete</button>
                </div>
              )}

              {isManager && noteEditId === post.id && (
                <div className="shop-note-editor">
                  <textarea
                    className="field-input"
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    placeholder="Reply as the shop manager..."
                    rows={2}
                    autoFocus
                  />
                  <div className="shop-note-editor-actions">
                    <button className="btn-cancel" onClick={() => { setNoteEditId(null); setNoteDraft('') }}>Cancel</button>
                    <button className="btn-confirm" onClick={() => saveNote(post.id)}>Save Reply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post to Shop Board</h2>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <form onSubmit={submitPost}>
              <div className="modal-body">
                <label className="field-label">Title *</label>
                <input
                  className="field-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Short summary of your feedback"
                  autoFocus
                />

                <label className="field-label">Details</label>
                <textarea
                  className="field-input"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Add any details, context, or ideas..."
                  rows={4}
                />

                <label className="field-label">Type</label>
                <div className="shop-cat-picker">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`shop-cat-choice cat-${c.value} ${category === c.value ? 'selected' : ''}`}
                      onClick={() => setCategory(c.value)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <label className="field-label">Your Name (optional)</label>
                <input
                  className="field-input"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="Leave blank to post anonymously"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={!title.trim()}>Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
