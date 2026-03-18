import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isToday, startOfDay,
  addDays, subDays, startOfWeek, endOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin } from 'lucide-react'
import { fetchEvents, deleteFamilyEvent } from '../lib/google'
import { useApp, useLang } from '../App'
import type { FamilyEvent } from '../types'
import { EVENT_TYPES } from '../types'
import EventModal from '../components/EventModal'

type ViewMode = 'day' | 'week' | 'month'

export default function Events() {
  const { calendarIds } = useApp()
  const { lang, s } = useLang()
  const isRtl = lang === 'he'
  const weekStartsOn = 0 as const

  const today = startOfDay(new Date())
  const [view, setView] = useState<ViewMode>('month')
  const [selectedDay, setSelectedDay] = useState(today)
  const [navDate, setNavDate] = useState(today)
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    if (!calendarIds) return
    setLoading(true)
    try {
      let start: Date, end: Date
      if (view === 'day') {
        start = startOfDay(navDate)
        end = addDays(start, 1)
      } else if (view === 'week') {
        start = startOfWeek(navDate, { weekStartsOn })
        end = addDays(endOfWeek(navDate, { weekStartsOn }), 1)
      } else {
        start = startOfMonth(navDate)
        end = addDays(endOfMonth(navDate), 1)
      }
      const evs = await fetchEvents(calendarIds.events, start.toISOString(), end.toISOString())
      setEvents(evs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds, view, navDate])

  async function handleDelete(ev: FamilyEvent) {
    if (!calendarIds || !confirm(s.deleteEvent(ev.title))) return
    setDeleting(ev.id)
    try {
      await deleteFamilyEvent(calendarIds.events, ev.id)
      setEvents(prev => prev.filter(e => e.id !== ev.id))
    } catch (e) {
      alert(String(e))
    } finally {
      setDeleting(null)
    }
  }

  function changeView(v: ViewMode) {
    setView(v)
    setNavDate(selectedDay) // re-anchor to selected day
  }

  function goPrev() {
    if (view === 'day') {
      const d = isRtl ? addDays(navDate, 1) : subDays(navDate, 1)
      setNavDate(d); setSelectedDay(d)
    } else if (view === 'week') {
      setNavDate(d => isRtl ? addDays(d, 7) : subDays(d, 7))
    } else {
      setNavDate(d => isRtl ? addMonths(d, 1) : subMonths(d, 1))
    }
  }

  function goNext() {
    if (view === 'day') {
      const d = isRtl ? subDays(navDate, 1) : addDays(navDate, 1)
      setNavDate(d); setSelectedDay(d)
    } else if (view === 'week') {
      setNavDate(d => isRtl ? subDays(d, 7) : addDays(d, 7))
    } else {
      setNavDate(d => isRtl ? subMonths(d, 1) : addMonths(d, 1))
    }
  }

  // All-day events have start as "YYYY-MM-DD" — new Date() parses that as UTC midnight
  // which shifts to the previous day in UTC+ timezones. Parse as local midnight instead.
  function parseStart(dateStr: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return new Date(dateStr)
  }

  function eventsOnDay(day: Date) {
    return events.filter(ev => isSameDay(parseStart(ev.start), day))
  }

  const dayEvents = events.filter(ev => isSameDay(parseStart(ev.start), selectedDay))

  // Nav title
  let navTitle: string
  if (view === 'day') {
    navTitle = isToday(navDate) ? s.today : format(navDate, lang === 'he' ? 'EEE, d/M' : 'EEE, MMM d')
  } else if (view === 'week') {
    const ws = startOfWeek(navDate, { weekStartsOn })
    const we = endOfWeek(navDate, { weekStartsOn })
    navTitle = `${format(ws, 'd/M')} – ${format(we, 'd/M/yyyy')}`
  } else {
    navTitle = `${s.calMonths[navDate.getMonth()]} ${navDate.getFullYear()}`
  }

  const selectedLabel = isToday(selectedDay)
    ? s.today
    : format(selectedDay, lang === 'he' ? 'EEEE, d/M' : 'EEEE, MMM d')

  // Month grid
  const monthDays = eachDayOfInterval({ start: startOfMonth(navDate), end: endOfMonth(navDate) })
  const startPad = getDay(startOfMonth(navDate)) // always Sunday-first

  // Week row
  const weekStart = startOfWeek(navDate, { weekStartsOn })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function EventCard({ ev }: { ev: FamilyEvent }) {
    const meta = EVENT_TYPES[ev.type]
    const typeLabel = lang === 'he' ? meta.heLabel : meta.label
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{meta.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{ev.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {ev.allDay ? s.allDay : `${format(new Date(ev.start), 'HH:mm')}–${format(new Date(ev.end), 'HH:mm')}`}
                </p>
                {ev.location && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {ev.location}
                  </p>
                )}
                {ev.notes && <p className="text-xs text-gray-500 mt-1 italic">{ev.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(ev)}
                disabled={deleting === ev.id}
                className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg flex-shrink-0 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
              {typeLabel}
            </span>
          </div>
        </div>
      </div>
    )
  }

  function DayDots({ day }: { day: Date }) {
    const evs = eventsOnDay(day)
    return (
      <div className="flex gap-0.5 h-1.5 items-center justify-center">
        {evs.slice(0, 3).map((ev, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPES[ev.type].dotColor}`} />
        ))}
      </div>
    )
  }

  function DayBtn({ day, size = 'md' }: { day: Date; size?: 'sm' | 'md' }) {
    const selected = isSameDay(day, selectedDay)
    const todayDay = isToday(day)
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
    return (
      <button
        type="button"
        onClick={() => setSelectedDay(startOfDay(day))}
        className="flex flex-col items-center gap-0.5 py-0.5 w-full"
      >
        <span className={[
          `${sz} flex items-center justify-center rounded-full font-medium transition-colors`,
          selected ? 'bg-indigo-600 text-white' : '',
          !selected && todayDay ? 'text-indigo-600 font-bold ring-1 ring-inset ring-indigo-300' : '',
          !selected && !todayDay ? 'text-gray-700 hover:bg-indigo-50' : '',
        ].join(' ')}>
          {format(day, 'd')}
        </span>
        <DayDots day={day} />
      </button>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">{s.eventsTitle}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> {s.add}
        </button>
      </div>

      {/* View toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['day', 'week', 'month'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => changeView(v)}
            className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
              view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v === 'day' ? s.viewDay : v === 'week' ? s.viewWeek : s.viewMonth}
          </button>
        ))}
      </div>

      {/* Calendar panel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {/* Nav header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="text-sm font-bold text-gray-800">{navTitle}</span>
          <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Day view — just the date, no grid */}
        {view === 'day' && (
          <p className="text-center text-sm text-gray-500 py-1">
            {dayEvents.length === 0
              ? s.noEventsDay
              : `${dayEvents.length} ${lang === 'he' ? (dayEvents.length === 1 ? 'אירוע' : 'אירועים') : (dayEvents.length === 1 ? 'event' : 'events')}`
            }
          </p>
        )}

        {/* Week/Month: day-of-week headers */}
        {(view === 'week' || view === 'month') && (
          <div className="grid grid-cols-7 mb-1" dir="ltr">
            {s.calDays.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
            ))}
          </div>
        )}

        {/* Week grid */}
        {view === 'week' && (
          <div className="grid grid-cols-7" dir="ltr">
            {weekDays.map(day => <DayBtn key={day.toISOString()} day={day} />)}
          </div>
        )}

        {/* Month grid */}
        {view === 'month' && (
          <div className="grid grid-cols-7 gap-y-1" dir="ltr">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {monthDays.map(day => <DayBtn key={day.toISOString()} day={day} size="sm" />)}
          </div>
        )}
      </div>

      {/* Selected day label (day view only) */}
      {view === 'day' && (
        <p className="text-sm font-semibold text-gray-700">{selectedLabel}</p>
      )}

      {/* Events list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse shadow-sm" />)}
        </div>
      ) : view === 'day' ? (
        // Day view: selected day's events
        dayEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-gray-400 text-sm">{s.noEventsDay}</p>
            <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800">
              {s.scheduleSomething}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )
      ) : (
        // Week/Month view: all events grouped by day
        events.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-gray-400 text-sm">{s.noEventsDay}</p>
            <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800">
              {s.scheduleSomething}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(view === 'week' ? weekDays : monthDays).map(day => {
              const dayEvs = eventsOnDay(day)
              if (dayEvs.length === 0) return null
              const dayLbl = isToday(day) ? s.today : format(day, lang === 'he' ? 'EEEE, d/M' : 'EEEE, MMM d')
              return (
                <div key={day.toISOString()}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{dayLbl}</p>
                  <div className="space-y-2">
                    {dayEvs.map(ev => <EventCard key={ev.id} ev={ev} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {showModal && (
        <EventModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
