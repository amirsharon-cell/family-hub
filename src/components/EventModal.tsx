import { useState } from 'react'
import { format, addHours } from 'date-fns'
import { X } from 'lucide-react'
import { createFamilyEvent } from '../lib/google'
import { useApp } from '../App'
import type { FamilyEvent } from '../types'
import { EVENT_TYPES } from '../types'

function toLocalInputValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export default function EventModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const { calendarIds, user } = useApp()
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<FamilyEvent['type']>('dinner')
  const [start, setStart] = useState(toLocalInputValue(addHours(now, 1)))
  const [end, setEnd] = useState(toLocalInputValue(addHours(now, 3)))
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!calendarIds || !title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError('')
    try {
      await createFamilyEvent(calendarIds.events, {
        title: title.trim(),
        type,
        start: allDay ? start.slice(0, 10) : new Date(start).toISOString(),
        end: allDay ? end.slice(0, 10) : new Date(end).toISOString(),
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add Event</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Family dinner at Nonna's"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(EVENT_TYPES) as [FamilyEvent['type'], typeof EVENT_TYPES[keyof typeof EVENT_TYPES]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  type === key ? meta.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* All day toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAllDay((v) => !v)}
            className={`w-10 h-6 rounded-full transition-colors relative ${allDay ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-700">All day</span>
        </div>

        {/* Date/time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
            <input
              type={allDay ? 'date' : 'datetime-local'}
              value={allDay ? start.slice(0, 10) : start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
            <input
              type={allDay ? 'date' : 'datetime-local'}
              value={allDay ? end.slice(0, 10) : end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Central Park"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any details…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Add to Calendar'}
        </button>
      </div>
    </div>
  )
}
