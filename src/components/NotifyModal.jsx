import React, { useState } from 'react'
import { isPushSupported, registerPush, getSubscribedMemberId, setSubscribedMemberId } from '../pushUtils'
import './Modal.css'

export default function NotifyModal({ members, onClose }) {
  const currentId = getSubscribedMemberId()
  const [memberId, setMemberId] = useState(currentId || members[0]?.id || '')
  const [status, setStatus] = useState(currentId ? 'subscribed' : 'idle')
  const [error, setError] = useState(null)

  async function handleEnable() {
    if (!memberId) return
    setStatus('loading')
    setError(null)

    const result = await registerPush(memberId)
    if (result.ok) {
      setSubscribedMemberId(memberId)
      setStatus('subscribed')
    } else {
      setStatus('idle')
      if (result.reason === 'denied') setError('Notification permission was denied. Please allow in your browser settings.')
      else if (result.reason === 'not-supported') setError('Push notifications are not supported on this browser.')
      else if (result.reason === 'config-error') setError('Push notification configuration error. Contact your manager.')
      else setError('Something went wrong. Please try again.')
    }
  }

  function handleDisable() {
    localStorage.removeItem('push_member_id')
    setStatus('idle')
  }

  if (!isPushSupported()) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Notifications</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
              Push notifications aren't supported on this browser. Try using Chrome or Edge, or add this app to your home screen on iOS.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Task Reminders</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {status === 'subscribed' ? (
            <>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                ✓ Reminders are enabled for <strong>{members.find(m => m.id === currentId)?.name || 'you'}</strong> on this device.
              </p>
              <button className="btn-cancel" style={{ width: '100%', marginTop: 4 }} onClick={handleDisable}>
                Disable Reminders
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                Get push notifications when your tasks are due. Pick your name and tap enable.
              </p>
              <label className="field-label">Who are you?</label>
              <select className="field-input" value={memberId} onChange={e => setMemberId(e.target.value)}>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {error && <p className="error-msg">{error}</p>}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Close</button>
          {status !== 'subscribed' && (
            <button className="btn-confirm" onClick={handleEnable} disabled={status === 'loading' || !memberId}>
              {status === 'loading' ? 'Enabling...' : 'Enable Reminders'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
