import { useState, useEffect } from 'react'
import { format, startOfDay, addDays, addMonths, isToday, isTomorrow } from 'date-fns'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { fetchEvents, deleteFamilyEvent } from '../lib/google'
import { useApp } from '../App'
import type { FamilyEvent } from '../types'
import { EVENT_TYPES } from '../types'
import EventModal from '../components/EventModal'

type Range = '7d' | '30d' | '3m'

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE, MMM d')
}

export default function Events() {
  const { calendarIds } = useApp()
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('30d')
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    if (!calendarIds) return
    setLoading(true)
    try {
      const now = startOfDay(new Date())
      const end =
        range === '7d' ? addDays(now, 7)
        : range === '30d' ? addDays(now, 30)
        : addMonths(now, 3)
      const evs = await fetchEvents(calendarIds.events, now.toISOString(), end.toISOString())
      setEvents(evs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds, range])

  async function handleDelete(ev: FamilyEvent) {
    if (!calendarIds || !confirm(`Delete "${ev.title}"?`)) return
    setDeleting(ev.id)
    try {
      await deleteFamilyEvent(calendarIds.events, ev.id)
      setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    } catch (e) {
      alert(String(e))
    } finally {
      setDeleting(null)
    }
  }

  const rangeButtons: { label: string; value: Range }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '3 months', value: '3m' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">Events</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Range filter */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {rangeButtons.map((b) => (
          <button
            key={b.value}
            onClick={() => setRange(b.value)}
            className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
              range === b.value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500 text-sm">No events in this range</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
            Schedule something →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => {
            const meta = EVENT_TYPES[ev.type]
            return (
              <div key={ev.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {dayLabel(ev.start)}
                          {!ev.allDay && (
                            <> · {format(new Date(ev.start), 'HH:mm')}–{format(new Date(ev.end), 'HH:mm')}</>
                          )}
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
                      {meta.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
