import { useState } from 'react'
import { format, set } from 'date-fns'
import { X } from 'lucide-react'
import { createFamilyEvent } from '../lib/google'
import { useApp } from '../App'
import { useLang } from '../App'
import type { EventType } from '../types'
import { EVENT_TYPES } from '../types'
import CalendarPicker from './CalendarPicker'

function timeToDate(base: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  return set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
}

export default function EventModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const { calendarIds, user } = useApp()
  const { lang, s } = useLang()
  const now = new Date()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('dinner')
  const [date, setDate] = useState(now)
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('21:00')
  const [allDay, setAllDay] = useState(false)
  const [endDate, setEndDate] = useState(now)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!calendarIds || !title.trim()) { setError(s.titleRequired); return }

    let startISO: string
    let endISO: string

    if (allDay) {
      startISO = format(date, 'yyyy-MM-dd')
      const ed = endDate >= date ? endDate : date
      endISO = format(ed, 'yyyy-MM-dd')
    } else {
      const start = timeToDate(date, startTime)
      const end = timeToDate(date, endTime)
      if (end <= start) { setError(s.endAfterStart); return }
      startISO = start.toISOString()
      endISO = end.toISOString()
    }

    setSaving(true)
    setError('')
    try {
      await createFamilyEvent(calendarIds.events, {
        title: title.trim(),
        type,
        start: startISO,
        end: endISO,
        allDay,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        createdBy: user?.email ?? '',
      })
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md max-h-[92dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{s.addEvent}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={s.eventTitlePlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Type chips */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{s.eventType}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    type === key ? meta.color : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white',
                  ].join(' ')}
                >
                  {meta.emoji} {lang === 'he' ? meta.heLabel : meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* All-day toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllDay(v => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${allDay ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-700">{s.allDay}</span>
          </div>

          {/* Start date calendar */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3">
              {allDay ? s.startDate : s.dateLabel}
            </p>
            <CalendarPicker value={date} onChange={setDate} />
          </div>

          {/* Time inputs — non-all-day */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{s.startTime}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{s.endTime}</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* End date — all-day multi-day */}
          {allDay && (
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-3">{s.endDate}</p>
              <CalendarPicker
                value={endDate >= date ? endDate : date}
                onChange={setEndDate}
                minDate={date}
              />
            </div>
          )}

          {/* Location */}
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={s.locationPlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder={s.notesPlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

        </div>
        {/* Sticky save button — always visible regardless of scroll */}
        <div className="px-5 pb-5 pt-3 pb-safe border-t border-gray-100 bg-white">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? s.saving : s.addToCalendar}
          </button>
        </div>
      </div>
    </div>
  )
}
