import { useState, useEffect } from 'react'
import { format, startOfDay, addDays, isToday, isTomorrow } from 'date-fns'
import { Plus, Car } from 'lucide-react'
import { fetchEvents, fetchCarBookings } from '../lib/google'
import { useApp } from '../App'
import { useLang } from '../App'
import type { FamilyEvent, CarBooking } from '../types'
import { EVENT_TYPES, CAR_OPTIONS } from '../types'
import type { Strings } from '../lib/i18n'
import EventModal from '../components/EventModal'
import BookingModal from '../components/BookingModal'

function dayLabel(dateStr: string, s: Strings, lang: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return s.today
  if (isTomorrow(d)) return s.tomorrow
  return format(d, lang === 'he' ? 'EEEE, d/M' : 'EEEE, MMM d')
}

export default function Home() {
  const { user, calendarIds } = useApp()
  const { lang, s } = useLang()
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [carBookings, setCarBookings] = useState<CarBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)

  const load = async () => {
    if (!calendarIds) return
    setLoading(true)
    try {
      const now = new Date()
      const end = addDays(now, 7)
      const [evs, bookings] = await Promise.all([
        fetchEvents(calendarIds.events, startOfDay(now).toISOString(), end.toISOString()),
        fetchCarBookings(calendarIds.car, startOfDay(now).toISOString(), end.toISOString()),
      ])
      setEvents(evs)
      setCarBookings(bookings)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds])

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const todayStr = format(new Date(), lang === 'he' ? 'EEEE, d/M/yyyy' : 'EEEE, MMMM d')

  // Car status today
  const todayBooking = carBookings.find((b) => isToday(new Date(b.start)))

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="text-sm text-gray-500">{todayStr}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {lang === 'he' ? `שלום, ${firstName} 👋` : `Hi, ${firstName} 👋`}
        </h1>
      </div>

      {/* Car status card */}
      <div
        className={`rounded-2xl p-4 flex items-center gap-4 shadow-sm ${
          todayBooking ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
        }`}
      >
        <div className={`rounded-full p-3 ${todayBooking ? 'bg-amber-100' : 'bg-green-100'}`}>
          <Car size={22} className={todayBooking ? 'text-amber-600' : 'text-green-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {todayBooking
              ? (() => { const c = CAR_OPTIONS.find(x => x.id === todayBooking.carId) ?? CAR_OPTIONS[0]; return `${c.emoji} ${c.label}` })()
              : s.carTitle}
          </p>
          {todayBooking ? (
            <p className="text-xs text-amber-700 truncate">
              {s.carBooked(
                todayBooking.bookedByName,
                format(new Date(todayBooking.start), 'HH:mm'),
                format(new Date(todayBooking.end), 'HH:mm')
              )}
            </p>
          ) : (
            <p className="text-xs text-green-700">{s.carAvailable}</p>
          )}
        </div>
        <button
          onClick={() => setShowCarModal(true)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
        >
          {s.bookArrow}
        </button>
      </div>

      {/* Upcoming events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">{s.next7Days}</h2>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
            <Plus size={16} /> {s.add}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">{s.noEventsComingUp}</p>
            <button
              onClick={() => setShowEventModal(true)}
              className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              {s.addFirstOne}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => {
              const meta = EVENT_TYPES[ev.type]
              const typeLabel = lang === 'he' ? meta.heLabel : meta.label
              return (
                <div key={ev.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500">
                      {dayLabel(ev.start, s, lang)}
                      {!ev.allDay && ` · ${format(new Date(ev.start), 'HH:mm')}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
                    {typeLabel}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showEventModal && (
        <EventModal
          onClose={() => setShowEventModal(false)}
          onSaved={() => { setShowEventModal(false); load() }}
        />
      )}
      {showCarModal && (
        <BookingModal
          existingBookings={carBookings}
          onClose={() => setShowCarModal(false)}
          onSaved={() => { setShowCarModal(false); load() }}
        />
      )}
    </div>
  )
}
