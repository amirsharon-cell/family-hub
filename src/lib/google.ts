import type { FamilyEvent, CarBooking } from '../types'

const CLIENT_ID = '953894951691-4i23ee5aoks1iehjisg6m1nmhbjl8bkl.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar openid profile email'
const CAL_BASE = 'https://www.googleapis.com/calendar/v3'

// ─── Token management ────────────────────────────────────────────────────────

let _token: string | null = null
let _tokenClient: { requestAccessToken: (o: object) => void } | null = null
let _onToken: ((token: string | null) => void) | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      // Script tag already added; poll until the global is ready
      const id = setInterval(() => {
        if ((window as unknown as Record<string, unknown>).google) {
          clearInterval(id)
          resolve()
        }
      }, 50)
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

export async function initAuth(onToken: (token: string | null) => void): Promise<void> {
  _onToken = onToken
  await loadScript('https://accounts.google.com/gsi/client')

  const g = (window as unknown as { google: { accounts: { oauth2: { initTokenClient: (o: object) => { requestAccessToken: (o: object) => void }, revoke: (t: string, cb: () => void) => void } } } }).google

  _tokenClient = g.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp: { access_token?: string }) => {
      if (resp.access_token) {
        _token = resp.access_token
        _onToken?.(resp.access_token)
      } else {
        _onToken?.(null)
      }
    },
  })
}

export function signIn() {
  _tokenClient?.requestAccessToken({ prompt: '' })
}

export function signOut() {
  const g = (window as unknown as { google?: { accounts?: { oauth2?: { revoke: (t: string, cb: () => void) => void } } } }).google
  if (_token) g?.accounts?.oauth2?.revoke(_token, () => {})
  _token = null
}

export function getToken() {
  return _token
}

// ─── Raw API helper ───────────────────────────────────────────────────────────

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  if (!_token) throw new Error('Not authenticated')
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${_token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`)
  return data as T
}

// ─── User info ────────────────────────────────────────────────────────────────

export async function getUserInfo() {
  return api<{ name: string; email: string; picture: string }>(
    'https://www.googleapis.com/oauth2/v2/userinfo'
  )
}

// ─── Calendar management ──────────────────────────────────────────────────────

export async function listCalendars(): Promise<{ id: string; summary: string }[]> {
  const data = await api<{ items: { id: string; summary: string }[] }>(
    `${CAL_BASE}/users/me/calendarList`
  )
  return data.items ?? []
}

export async function createCalendar(summary: string, description: string): Promise<{ id: string }> {
  return api<{ id: string }>(`${CAL_BASE}/calendars`, {
    method: 'POST',
    body: JSON.stringify({ summary, description }),
  })
}

// ─── Events ───────────────────────────────────────────────────────────────────

interface GCalEvent {
  id: string
  summary: string
  description?: string
  location?: string
  htmlLink?: string
  organizer?: { email: string; displayName?: string }
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

function parseEventType(desc: string | undefined): FamilyEvent['type'] {
  try {
    const meta = JSON.parse(desc ?? '{}')
    return meta.type ?? 'other'
  } catch {
    return 'other'
  }
}

function toFamilyEvent(e: GCalEvent): FamilyEvent {
  const allDay = !e.start.dateTime
  return {
    id: e.id,
    title: e.summary,
    type: parseEventType(e.description),
    start: e.start.dateTime ?? e.start.date ?? '',
    end: e.end.dateTime ?? e.end.date ?? '',
    allDay,
    location: e.location,
    notes: (() => { try { return JSON.parse(e.description ?? '{}').notes } catch { return undefined } })(),
    createdBy: e.organizer?.email ?? '',
    htmlLink: e.htmlLink,
  }
}

function toCarBooking(e: GCalEvent): CarBooking {
  let purpose = e.summary.replace(/^\[Car\]\s*/, '')
  let bookedByName = e.organizer?.displayName ?? e.organizer?.email ?? ''
  try {
    const meta = JSON.parse(e.description ?? '{}')
    if (meta.purpose) purpose = meta.purpose
    if (meta.bookedByName) bookedByName = meta.bookedByName
  } catch { /* ignore */ }
  return {
    id: e.id,
    purpose,
    start: e.start.dateTime ?? '',
    end: e.end.dateTime ?? '',
    bookedBy: e.organizer?.email ?? '',
    bookedByName,
    htmlLink: e.htmlLink,
  }
}

export async function fetchEvents(calendarId: string, timeMin: string, timeMax: string): Promise<FamilyEvent[]> {
  const params = new URLSearchParams({
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin,
    timeMax,
  })
  const data = await api<{ items: GCalEvent[] }>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  )
  return (data.items ?? []).map(toFamilyEvent)
}

export async function createFamilyEvent(
  calendarId: string,
  event: Omit<FamilyEvent, 'id' | 'htmlLink'>
): Promise<FamilyEvent> {
  const body = {
    summary: event.title,
    description: JSON.stringify({ type: event.type, notes: event.notes ?? '' }),
    location: event.location,
    start: event.allDay ? { date: event.start.slice(0, 10) } : { dateTime: event.start },
    end: event.allDay ? { date: event.end.slice(0, 10) } : { dateTime: event.end },
  }
  const created = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return toFamilyEvent(created)
}

export async function deleteFamilyEvent(calendarId: string, eventId: string): Promise<void> {
  await api<void>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'DELETE' }
  )
}

// ─── Car bookings ─────────────────────────────────────────────────────────────

export async function fetchCarBookings(calendarId: string, timeMin: string, timeMax: string): Promise<CarBooking[]> {
  const params = new URLSearchParams({
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin,
    timeMax,
  })
  const data = await api<{ items: GCalEvent[] }>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  )
  return (data.items ?? []).map(toCarBooking)
}

export async function createCarBooking(
  calendarId: string,
  booking: { purpose: string; start: string; end: string; bookedByName: string }
): Promise<CarBooking> {
  const body = {
    summary: `[Car] ${booking.purpose}`,
    description: JSON.stringify({ purpose: booking.purpose, bookedByName: booking.bookedByName }),
    start: { dateTime: booking.start },
    end: { dateTime: booking.end },
  }
  const created = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return toCarBooking(created)
}

export async function deleteCarBooking(calendarId: string, eventId: string): Promise<void> {
  await api<void>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'DELETE' }
  )
}
