import { useState } from 'react'
import { format, set, areIntervalsOverlapping, startOfDay } from 'date-fns'
import { X, AlertTriangle } from 'lucide-react'
import { createCarBooking } from '../lib/google'
import { useApp } from '../App'
import type { CarBooking } from '../types'
import CalendarPicker from './CalendarPicker'

function timeToDate(base: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  return set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
}

export default function BookingModal({
  existingBookings,
  onClose,
  onSaved,
}: {
  existingBookings: CarBooking[]
  onClose: () => void
  onSaved: () => void
}) {
  const { calendarIds, user } = useApp()
  const now = new Date()

  const [purpose, setPurpose] = useState('')
  const [date, setDate] = useState(now)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startDate = timeToDate(date, startTime)
  const endDate = timeToDate(date, endTime)
  const validTimes = endDate > startDate

  const conflicts = validTimes
    ? existingBookings.filter(b =>
        areIntervalsOverlapping(
          { start: startDate, end: endDate },
          { start: new Date(b.start), end: new Date(b.end) }
        )
      )
    : []

  async function handleSave() {
    if (!calendarIds || !purpose.trim()) { setError('Purpose is required.'); return }
    if (!validTimes) { setError('End time must be after start time.'); return }
    setSaving(true)
    setError('')
    try {
      await createCarBooking(calendarIds.car, {
        purpose: purpose.trim(),
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        bookedByName: user?.name ?? user?.email ?? '',
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">🚗 Book the Car</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Scheduling conflict!</p>
                {conflicts.map(c => (
                  <p key={c.id} className="text-xs mt-0.5">
                    {c.bookedByName}: {format(new Date(c.start), 'HH:mm')}–{format(new Date(c.end), 'HH:mm')} · {c.purpose}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Purpose */}
          <input
            type="text"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder="Purpose (e.g. School pickup)"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Date calendar */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3">Date</p>
            <CalendarPicker value={date} onChange={setDate} minDate={startOfDay(now)} />
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Until</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !purpose.trim()}
            className={[
              'w-full rounded-xl py-3.5 font-medium transition-colors disabled:opacity-50',
              conflicts.length > 0
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700',
            ].join(' ')}
          >
            {saving ? 'Saving…' : conflicts.length > 0 ? 'Book anyway' : 'Book Car'}
          </button>
        </div>
      </div>
    </div>
  )
}
