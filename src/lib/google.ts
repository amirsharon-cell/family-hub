import { EVENT_TYPES, CAR_OPTIONS, CHORE_TYPES, FAMILY_MEMBERS } from '../types'
import type { FamilyEvent, CarBooking, EventType, CarId, ChoreItem, ChoreType, AssigneeId } from '../types'

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

function parseEventType(desc: string | undefined): EventType {
  try {
    const meta = JSON.parse(desc ?? '{}') as { type?: string }
    if (meta.type && meta.type in EVENT_TYPES) return meta.type as EventType
  } catch { /* ignore */ }
  return 'other'
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

const VALID_CAR_IDS = new Set<string>(CAR_OPTIONS.map(c => c.id))

function toCarBooking(e: GCalEvent): CarBooking {
  let purpose = e.summary.replace(/^\[Car\]\s*/, '')
  let bookedByName = e.organizer?.displayName ?? e.organizer?.email ?? ''
  let carId: CarId = 'kia-ev3'
  try {
    const meta = JSON.parse(e.description ?? '{}')
    if (meta.purpose) purpose = meta.purpose
    if (meta.bookedByName) bookedByName = meta.bookedByName
    if (meta.carId && VALID_CAR_IDS.has(meta.carId)) carId = meta.carId as CarId
  } catch { /* ignore */ }
  return {
    id: e.id,
    purpose,
    carId,
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

export async function updateFamilyEvent(
  calendarId: string,
  eventId: string,
  event: Omit<FamilyEvent, 'id' | 'htmlLink'>
): Promise<FamilyEvent> {
  const body = {
    summary: event.title,
    description: JSON.stringify({ type: event.type, notes: event.notes ?? '' }),
    location: event.location,
    start: event.allDay ? { date: event.start.slice(0, 10) } : { dateTime: event.start },
    end: event.allDay ? { date: event.end.slice(0, 10) } : { dateTime: event.end },
  }
  const updated = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  )
  return toFamilyEvent(updated)
}

export async function deleteFamilyEvent(calendarId: string, eventId: string): Promise<void> {
  await api<void>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'DELETE' }
  )
}

// ─── Car owner notifications ──────────────────────────────────────────────────

const CAR_OWNER_EMAIL: Record<string, string> = {
  'kia-ev3': 'Sheli.sharon@gmail.com',
  'aion-v':  'amir.sharon@gmail.com',
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
  booking: { purpose: string; carId: CarId; start: string; end: string; bookedByName: string }
): Promise<CarBooking> {
  const ownerEmail = CAR_OWNER_EMAIL[booking.carId]
  const body = {
    summary: `[Car] ${booking.purpose}`,
    description: JSON.stringify({ purpose: booking.purpose, carId: booking.carId, bookedByName: booking.bookedByName }),
    start: { dateTime: booking.start },
    end: { dateTime: booking.end },
    attendees: ownerEmail ? [{ email: ownerEmail }] : undefined,
  }
  const created = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return toCarBooking(created)
}

export async function updateCarBooking(
  calendarId: string,
  eventId: string,
  booking: { purpose: string; carId: CarId; start: string; end: string; bookedByName: string }
): Promise<CarBooking> {
  const ownerEmail = CAR_OWNER_EMAIL[booking.carId]
  const body = {
    summary: `[Car] ${booking.purpose}`,
    description: JSON.stringify({ purpose: booking.purpose, carId: booking.carId, bookedByName: booking.bookedByName }),
    start: { dateTime: booking.start },
    end: { dateTime: booking.end },
    attendees: ownerEmail ? [{ email: ownerEmail }] : undefined,
    sendUpdates: 'all',
  }
  const updated = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=all`,
    { method: 'PUT', body: JSON.stringify(body) }
  )
  return toCarBooking(updated)
}

export async function deleteCarBooking(calendarId: string, eventId: string): Promise<void> {
  await api<void>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'DELETE' }
  )
}

// ─── Chore assignee emails ────────────────────────────────────────────────────

const ASSIGNEE_EMAIL: Record<string, string> = {
  yonatan: 'yonatan.sharon@gmail.com',
  mika:    'mik.sharon@gmail.com',
}

// ─── Chores ───────────────────────────────────────────────────────────────────

function toChoreItem(e: GCalEvent): ChoreItem {
  let choreType: ChoreType = 'custom'
  let assignedTo: AssigneeId = 'yonatan'
  let weight = 1
  let completed = false
  let completedAt: string | undefined
  let notes: string | undefined
  let title = e.summary

  try {
    const meta = JSON.parse(e.description ?? '{}')
    if (meta.choreType && meta.choreType in CHORE_TYPES) choreType = meta.choreType as ChoreType
    if (meta.assignedTo && meta.assignedTo in FAMILY_MEMBERS) assignedTo = meta.assignedTo as AssigneeId
    if (meta.weight) weight = meta.weight
    if (meta.completed !== undefined) completed = meta.completed
    if (meta.completedAt) completedAt = meta.completedAt
    if (meta.notes) notes = meta.notes
    if (meta.title) title = meta.title
  } catch { /* ignore */ }

  return {
    id: e.id,
    title,
    choreType,
    assignedTo,
    dueDate: e.start.date ?? e.start.dateTime?.slice(0, 10) ?? '',
    completed,
    completedAt,
    weight,
    notes,
  }
}

export async function fetchChores(calendarId: string, timeMin: string, timeMax: string): Promise<ChoreItem[]> {
  const params = new URLSearchParams({ orderBy: 'startTime', singleEvents: 'true', timeMin, timeMax })
  const data = await api<{ items: GCalEvent[] }>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  )
  return (data.items ?? []).map(toChoreItem)
}

function choreBody(chore: Omit<ChoreItem, 'id'>) {
  const meta = CHORE_TYPES[chore.choreType]
  const assigneeEmail = ASSIGNEE_EMAIL[chore.assignedTo]
  return {
    summary: `${meta.emoji} ${chore.title}`,
    description: JSON.stringify({
      title: chore.title, choreType: chore.choreType, assignedTo: chore.assignedTo,
      weight: chore.weight, completed: chore.completed, completedAt: chore.completedAt, notes: chore.notes,
    }),
    start: { date: chore.dueDate },
    end: { date: chore.dueDate },
    attendees: assigneeEmail ? [{ email: assigneeEmail }] : undefined,
  }
}

export async function createChore(calendarId: string, chore: Omit<ChoreItem, 'id'>): Promise<ChoreItem> {
  const created = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    { method: 'POST', body: JSON.stringify(choreBody(chore)) }
  )
  return toChoreItem(created)
}

export async function updateChore(calendarId: string, choreId: string, chore: Omit<ChoreItem, 'id'>): Promise<ChoreItem> {
  const updated = await api<GCalEvent>(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${choreId}?sendUpdates=all`,
    { method: 'PUT', body: JSON.stringify(choreBody(chore)) }
  )
  return toChoreItem(updated)
}

export async function deleteChore(calendarId: string, choreId: string): Promise<void> {
  await api<void>(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${choreId}`, { method: 'DELETE' })
}
