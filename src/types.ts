export interface User {
  name: string
  email: string
  picture: string
}

export interface CalendarIds {
  events: string  // "Family Hub" calendar ID
  car: string     // "Family Car" calendar ID
}

export interface FamilyEvent {
  id: string
  title: string
  type: 'dinner' | 'show' | 'trip' | 'birthday' | 'other'
  start: string     // ISO datetime
  end: string       // ISO datetime
  allDay: boolean
  location?: string
  notes?: string
  createdBy: string // email
  htmlLink?: string
}

export interface CarBooking {
  id: string
  purpose: string
  start: string     // ISO datetime
  end: string       // ISO datetime
  bookedBy: string  // email
  bookedByName: string
  htmlLink?: string
}

export const EVENT_TYPES = {
  dinner: { label: 'Dinner', emoji: '🍽️', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  show: { label: 'Show / Movie', emoji: '🎬', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  trip: { label: 'Trip', emoji: '✈️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  birthday: { label: 'Birthday', emoji: '🎂', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  other: { label: 'Other', emoji: '📌', color: 'bg-gray-100 text-gray-700 border-gray-200' },
} as const
