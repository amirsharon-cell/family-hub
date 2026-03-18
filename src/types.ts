export interface User {
  name: string
  email: string
  picture: string
}

export interface CalendarIds {
  events: string  // "Family Hub" calendar ID
  car: string     // "Family Car" calendar ID
}

export const EVENT_TYPES = {
  breakfast:   { label: 'Breakfast',    emoji: '🍳', color: 'bg-yellow-100  text-yellow-700  border-yellow-200'  },
  lunch:       { label: 'Lunch',        emoji: '🥗', color: 'bg-lime-100    text-lime-700    border-lime-200'    },
  dinner:      { label: 'Dinner',       emoji: '🍽️', color: 'bg-orange-100  text-orange-700  border-orange-200'  },
  show:        { label: 'Movie / Show', emoji: '🎬', color: 'bg-purple-100  text-purple-700  border-purple-200'  },
  concert:     { label: 'Concert',      emoji: '🎵', color: 'bg-violet-100  text-violet-700  border-violet-200'  },
  sports:      { label: 'Sports',       emoji: '⚽', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  trip:        { label: 'Trip',         emoji: '✈️', color: 'bg-blue-100    text-blue-700    border-blue-200'    },
  birthday:    { label: 'Birthday',     emoji: '🎂', color: 'bg-pink-100    text-pink-700    border-pink-200'    },
  party:       { label: 'Party',        emoji: '🎉', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  appointment: { label: 'Appointment',  emoji: '📋', color: 'bg-slate-100   text-slate-700   border-slate-200'   },
  other:       { label: 'Other',        emoji: '📌', color: 'bg-gray-100    text-gray-700    border-gray-200'    },
} as const

export type EventType = keyof typeof EVENT_TYPES

export interface FamilyEvent {
  id: string
  title: string
  type: EventType
  start: string     // ISO datetime or date string
  end: string       // ISO datetime or date string
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
