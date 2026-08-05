import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function registerPush(memberId) {
  if (!isPushSupported()) return { ok: false, reason: 'not-supported' }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: 'denied' }

    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY not set')
      return { ok: false, reason: 'config-error' }
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Save to Supabase
    const subJson = subscription.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert({
      id: `${memberId}_${subJson.endpoint.slice(-20)}`,
      member_id: memberId,
      subscription: subJson,
    })

    if (error) {
      console.error('Failed to save push subscription:', error)
      return { ok: false, reason: 'save-failed' }
    }

    return { ok: true }
  } catch (err) {
    console.error('Push registration error:', err)
    return { ok: false, reason: 'error' }
  }
}

export function getSubscribedMemberId() {
  return localStorage.getItem('push_member_id')
}

export function setSubscribedMemberId(id) {
  localStorage.setItem('push_member_id', id)
}
