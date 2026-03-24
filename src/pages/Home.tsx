import { useState, useEffect } from 'react'
import { format, startOfDay, endOfDay, addDays, isToday, isTomorrow } from 'date-fns'
import { Plus, Car, CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { fetchEvents, fetchCarBookings, fetchChores, updateChore } from '../lib/google'
import { useApp } from '../App'
import { useLang } from '../App'
import type { FamilyEvent, CarBooking, ChoreItem } from '../types'
import { EVENT_TYPES, CAR_OPTIONS, CHORE_TYPES, FAMILY_MEMBERS } from '../types'
import type { Strings } from '../lib/i18n'
import EventModal from '../components/EventModal'
import BookingModal from '../components/BookingModal'
import { NavLink } from 'react-router-dom'

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
  const [todayChores, setTodayChores] = useState<ChoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [togglingChore, setTogglingChore] = useState<string | null>(null)

  const load = async () => {
    if (!calendarIds) return
    setLoading(true)
    try {
      const now = new Date()
      const end = addDays(now, 7)
      const fetches: Promise<unknown>[] = [
        fetchEvents(calendarIds.events, startOfDay(now).toISOString(), end.toISOString()),
        fetchCarBookings(calendarIds.car, startOfDay(now).toISOString(), end.toISOString()),
      ]
      if (calendarIds.chores) {
        fetches.push(fetchChores(calendarIds.chores, startOfDay(now).toISOString(), endOfDay(now).toISOString()))
      }
      const results = await Promise.all(fetches)
      setEvents(results[0] as FamilyEvent[])
      setCarBookings(results[1] as CarBooking[])
      if (calendarIds.chores) setTodayChores(results[2] as ChoreItem[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds])

  async function handleToggleChore(chore: ChoreItem) {
    if (!calendarIds?.chores) return
    setTogglingChore(chore.id)
    try {
      await updateChore(calendarIds.chores, chore.id, {
        ...chore,
        completed: !chore.completed,
        completedAt: !chore.completed ? new Date().toISOString() : undefined,
      })
      await load()
    } finally {
      setTogglingChore(null)
    }
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const todayStr = format(new Date(), lang === 'he' ? 'EEEE, d/M/yyyy' : 'EEEE, MMMM d')

  // Car status today
  const todayBooking = carBookings.find((b) => isToday(new Date(b.start)))

  const pendingChores = todayChores.filter(c => !c.completed)
  const doneChores = todayChores.filter(c => c.completed)

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

      {/* Today's chores — only shown if calendar is set up and there are chores */}
      {calendarIds?.chores && todayChores.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900">
                {lang === 'he' ? 'מטלות היום' : "Today's Chores"}
              </h2>
              {pendingChores.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                  {pendingChores.length}
                </span>
              )}
            </div>
            <NavLink
              to="/chores"
              className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
            >
              {lang === 'he' ? 'כל המטלות ←' : 'All chores →'}
            </NavLink>
          </div>

          <div className="space-y-2">
            {todayChores.map(chore => {
              const meta = CHORE_TYPES[chore.choreType]
              const member = FAMILY_MEMBERS[chore.assignedTo]
              return (
                <div
                  key={chore.id}
                  className={`bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 transition-opacity ${chore.completed ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={() => handleToggleChore(chore)}
                    disabled={togglingChore === chore.id}
                    className="flex-shrink-0 text-gray-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
                  >
                    {chore.completed
                      ? <CheckCircle2 size={22} className="text-green-500" />
                      : <Circle size={22} />}
                  </button>
                  <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                  <p className={`flex-1 text-sm font-medium min-w-0 truncate ${chore.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {chore.title}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${member.color}`}>
                    {lang === 'he' ? member.heName : member.name}
                  </span>
                </div>
              )
            })}
          </div>

          {doneChores.length > 0 && pendingChores.length === 0 && (
            <p className="text-xs text-green-600 font-medium text-center mt-2">
              {lang === 'he' ? '✅ כל המטלות בוצעו היום!' : '✅ All chores done for today!'}
            </p>
          )}
        </div>
      )}

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
