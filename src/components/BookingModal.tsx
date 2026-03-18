import { useState } from 'react'
import { format, set, areIntervalsOverlapping, startOfDay } from 'date-fns'
import { X, AlertTriangle } from 'lucide-react'
import { createCarBooking, updateCarBooking } from '../lib/google'
import { useApp } from '../App'
import { useLang } from '../App'
import type { CarBooking, CarId } from '../types'
import { CAR_OPTIONS } from '../types'
import CalendarPicker from './CalendarPicker'

function timeToDate(base: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  return set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
}

export default function BookingModal({
  existingBookings,
  booking,
  onClose,
  onSaved,
}: {
  existingBookings: CarBooking[]
  booking?: CarBooking
  onClose: () => void
  onSaved: () => void
}) {
  const { calendarIds, user } = useApp()
  const { s } = useLang()
  const now = new Date()
  const isEdit = !!booking

  const [purpose, setPurpose] = useState(booking?.purpose ?? '')
  const [carId, setCarId] = useState<CarId>(booking?.carId ?? 'kia-ev3')
  const [date, setDate] = useState(booking ? new Date(booking.start) : now)
  const [startTime, setStartTime] = useState(
    booking ? format(new Date(booking.start), 'HH:mm') : '09:00'
  )
  const [endTime, setEndTime] = useState(
    booking ? format(new Date(booking.end), 'HH:mm') : '10:00'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startDate = timeToDate(date, startTime)
  const endDate = timeToDate(date, endTime)
  const validTimes = endDate > startDate

  // Exclude the booking being edited from conflict detection
  const otherBookings = isEdit ? existingBookings.filter(b => b.id !== booking.id) : existingBookings

  const conflicts = validTimes
    ? otherBookings.filter(b =>
        areIntervalsOverlapping(
          { start: startDate, end: endDate },
          { start: new Date(b.start), end: new Date(b.end) }
        )
      )
    : []

  async function handleSave() {
    if (!calendarIds || !purpose.trim()) { setError(s.purposeRequired); return }
    if (!validTimes) { setError(s.endAfterStartBooking); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        purpose: purpose.trim(),
        carId,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        bookedByName: booking?.bookedByName ?? user?.name ?? user?.email ?? '',
      }
      if (isEdit) {
        await updateCarBooking(calendarIds.car, booking.id, payload)
      } else {
        await createCarBooking(calendarIds.car, payload)
      }
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
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? s.editBooking : s.bookCarTitle}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Car selector */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{s.chooseCar}</p>
            <div className="flex gap-2">
              {CAR_OPTIONS.map(car => (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => setCarId(car.id)}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors',
                    carId === car.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300 bg-white',
                  ].join(' ')}
                >
                  {car.emoji} {car.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">{s.conflict}</p>
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
            placeholder={s.purposePlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Date calendar */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3">{s.datePickerLabel}</p>
            <CalendarPicker value={date} onChange={setDate} minDate={isEdit ? undefined : startOfDay(now)} />
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{s.from}</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{s.until}</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>
        {/* Sticky save button — always visible regardless of scroll */}
        <div className="px-5 pb-5 pt-3 pb-safe border-t border-gray-100 bg-white">
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
            {saving ? s.saving : isEdit ? s.saveChanges : conflicts.length > 0 ? s.bookAnyway : s.bookCarBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
