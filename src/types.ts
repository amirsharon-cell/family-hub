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
  breakfast:   { label: 'Breakfast',    heLabel: 'ארוחת בוקר',   emoji: '🍳', color: 'bg-yellow-100  text-yellow-700  border-yellow-200',  dotColor: 'bg-yellow-400'  },
  lunch:       { label: 'Lunch',        heLabel: 'ארוחת צהריים', emoji: '🥗', color: 'bg-lime-100    text-lime-700    border-lime-200',    dotColor: 'bg-lime-500'    },
  dinner:      { label: 'Dinner',       heLabel: 'ארוחת ערב',    emoji: '🍽️', color: 'bg-orange-100  text-orange-700  border-orange-200',  dotColor: 'bg-orange-400'  },
  show:        { label: 'Movie / Show', heLabel: 'סרט / הצגה',   emoji: '🎬', color: 'bg-purple-100  text-purple-700  border-purple-200',  dotColor: 'bg-purple-400'  },
  concert:     { label: 'Concert',      heLabel: 'קונצרט',       emoji: '🎵', color: 'bg-violet-100  text-violet-700  border-violet-200',  dotColor: 'bg-violet-400'  },
  sports:      { label: 'Sports',       heLabel: 'ספורט',        emoji: '⚽', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-400' },
  trip:        { label: 'Trip',         heLabel: 'טיול',          emoji: '✈️', color: 'bg-blue-100    text-blue-700    border-blue-200',    dotColor: 'bg-blue-400'    },
  birthday:    { label: 'Birthday',     heLabel: 'יום הולדת',    emoji: '🎂', color: 'bg-pink-100    text-pink-700    border-pink-200',    dotColor: 'bg-pink-400'    },
  party:       { label: 'Party',        heLabel: 'מסיבה',        emoji: '🎉', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', dotColor: 'bg-fuchsia-400' },
  appointment: { label: 'Appointment',  heLabel: 'פגישה',        emoji: '📋', color: 'bg-slate-100   text-slate-700   border-slate-200',   dotColor: 'bg-slate-400'   },
  other:       { label: 'Other',        heLabel: 'אחר',          emoji: '📌', color: 'bg-gray-100    text-gray-700    border-gray-200',    dotColor: 'bg-gray-400'    },
} as const

export type EventType = keyof typeof EVENT_TYPES

export interface FamilyEvent {
  id: string
  title: string
  type: EventType
  start: string
  end: string
  allDay: boolean
  location?: string
  notes?: string
  createdBy: string
  htmlLink?: string
}

export const CAR_OPTIONS = [
  { id: 'kia-ev3', label: 'Kia EV3', emoji: '⚡' },
  { id: 'aion-v',  label: 'Aion V',  emoji: '🔋' },
] as const

export type CarId = typeof CAR_OPTIONS[number]['id']

export interface CarBooking {
  id: string
  purpose: string
  carId: CarId
  start: string
  end: string
  bookedBy: string
  bookedByName: string
  htmlLink?: string
}
