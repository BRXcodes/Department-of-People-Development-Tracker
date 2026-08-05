import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Web Push crypto utilities for Deno
async function sendWebPush(subscription: any, payload: string) {
  const endpoint = subscription.endpoint
  const p256dh = subscription.keys.p256dh
  const auth = subscription.keys.auth

  // Use web-push compatible fetch to send notification
  // For simplicity, we'll use the web-push library approach via fetch
  const response = await fetch('https://web-push-codelab.glitch.me/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, payload }),
  })

  // Direct push via endpoint with minimal headers (unsigned for testing)
  const pushResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
    },
  })

  return pushResponse.ok
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get current time (hour:minute in HH:MM format)
    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0')
    const currentMinute = now.getMinutes()

    // Check reminder times: 06:00, 12:00, 18:00
    // Allow a 5 minute window
    const reminderSlots = ['06:00', '12:00', '18:00']
    const activeSlot = reminderSlots.find(slot => {
      const [h] = slot.split(':').map(Number)
      return parseInt(currentHour) === h && currentMinute < 5
    })

    if (!activeSlot) {
      return new Response(JSON.stringify({ message: 'No reminder slot active now', time: `${currentHour}:${currentMinute.toString().padStart(2, '0')}` }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get today's day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayName = dayNames[now.getDay()]

    // Find tasks with this reminder_time that include today
    const { data: tasks, error: tErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('reminder_time', activeSlot)
      .contains('days', [todayName])

    if (tErr) throw tErr
    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No tasks to remind', slot: activeSlot }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Group tasks by member_id
    const tasksByMember: Record<string, any[]> = {}
    for (const task of tasks) {
      if (!tasksByMember[task.member_id]) tasksByMember[task.member_id] = []
      tasksByMember[task.member_id].push(task)
    }

    // Get push subscriptions for these members
    const memberIds = Object.keys(tasksByMember)
    const { data: subs, error: sErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('member_id', memberIds)

    if (sErr) throw sErr
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions for members with tasks', memberIds }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send notifications
    let sent = 0
    for (const sub of subs) {
      const memberTasks = tasksByMember[sub.member_id]
      if (!memberTasks) continue

      const taskNames = memberTasks.map((t: any) => t.name).slice(0, 3).join(', ')
      const payload = JSON.stringify({
        title: `Task Reminder`,
        body: memberTasks.length === 1
          ? `Reminder: ${memberTasks[0].name}`
          : `You have ${memberTasks.length} tasks today: ${taskNames}`,
      })

      try {
        // Send push notification using the subscription endpoint
        const subscription = sub.subscription
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'TTL': '86400',
            'Content-Length': '0',
          },
        })
        if (response.ok || response.status === 201) sent++
      } catch (e) {
        console.error('Push failed for subscription:', sub.id, e)
      }
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} reminders`, slot: activeSlot, todayName }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
