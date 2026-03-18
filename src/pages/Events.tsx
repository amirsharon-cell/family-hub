import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isToday, startOfDay, addDays,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin } from 'lucide-react'
import { fetchEvents, deleteFamilyEvent } from '../lib/google'
import { useApp, useLang } from '../App'
import type { FamilyEvent } from '../types'
import { EVENT_TYPES } from '../types'
import EventModal from '../components/EventModal'

export default function Events() {
  const { calendarIds } = useApp()
  const { lang, s } = useLang()
  const isRtl = lang === 'he'

  const today = startOfDay(new Date())
  const [selectedDay, setSelectedDay] = useState(today)
  const [viewMonth, setViewMonth] = useState(startOfMonth(today))
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    if (!calendarIds) return
    setLoading(true)
    try {
      const start = startOfMonth(viewMonth)
      const end = addDays(endOfMonth(viewMonth), 1)
      const evs = await fetchEvents(calendarIds.events, start.toISOString(), end.toISOString())
      setEvents(evs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds, viewMonth])

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

  // Calendar grid
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const startPad = isRtl
    ? getDay(startOfMonth(viewMonth))
    : (getDay(startOfMonth(viewMonth)) + 6) % 7

  function eventsOnDay(day: Date) {
    return events.filter(ev => isSameDay(new Date(ev.start), day))
  }

  const dayEvents = events.filter(ev => isSameDay(new Date(ev.start), selectedDay))

  const monthLabel = `${s.calMonths[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`

  function goToPrev() {
    const prev = isRtl ? addMonths(viewMonth, 1) : subMonths(viewMonth, 1)
    setViewMonth(prev)
    // keep selected day in sync if possible
  }
  function goToNext() {
    const next = isRtl ? subMonths(viewMonth, 1) : addMonths(viewMonth, 1)
    setViewMonth(next)
  }

  const selectedLabel = isToday(selectedDay)
    ? s.today
    : format(selectedDay, lang === 'he' ? 'EEEE, d/M' : 'EEEE, MMM d')

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

      {/* Month calendar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="text-sm font-bold text-gray-800">{monthLabel}</span>
          <button
            onClick={goToNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1" dir="ltr">
          {s.calDays.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1" dir="ltr">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const dayEvs = eventsOnDay(day)
            const selected = isSameDay(day, selectedDay)
            const todayDay = isToday(day)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(startOfDay(day))}
                className="flex flex-col items-center gap-0.5 py-1"
              >
                <span className={[
                  'w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors',
                  selected ? 'bg-indigo-600 text-white' : '',
                  !selected && todayDay ? 'text-indigo-600 font-bold ring-1 ring-inset ring-indigo-300' : '',
                  !selected && !todayDay ? 'text-gray-700 hover:bg-indigo-50' : '',
                ].join(' ')}>
                  {format(day, 'd')}
                </span>
                {/* Event dots */}
                <div className="flex gap-0.5 h-1.5 items-center">
                  {dayEvs.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPES[ev.type].dotColor ?? 'bg-indigo-400'}`}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">{selectedLabel}</p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-gray-400 text-sm">{s.noEventsDay}</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              {s.scheduleSomething}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(ev => {
              const meta = EVENT_TYPES[ev.type]
              const typeLabel = lang === 'he' ? meta.heLabel : meta.label
              return (
                <div key={ev.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{ev.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ev.allDay
                              ? s.allDay
                              : `${format(new Date(ev.start), 'HH:mm')}–${format(new Date(ev.end), 'HH:mm')}`
                            }
                          </p>
                          {ev.location && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin size={10} /> {ev.location}
                            </p>
                          )}
                          {ev.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{ev.notes}</p>
                          )}
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
            })}
          </div>
        )}
      </div>

      {showModal && (
        <EventModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
