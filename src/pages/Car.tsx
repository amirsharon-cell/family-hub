import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, addDays, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { fetchCarBookings, deleteCarBooking } from '../lib/google'
import { useApp } from '../App'
import type { CarBooking } from '../types'
import BookingModal from '../components/BookingModal'

const MEMBER_COLORS = [
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-rose-100 text-rose-700 border-rose-200',
]

const emailColorCache: Record<string, string> = {}
let colorIndex = 0
function colorForEmail(email: string) {
  if (!emailColorCache[email]) {
    emailColorCache[email] = MEMBER_COLORS[colorIndex % MEMBER_COLORS.length]
    colorIndex++
  }
  return emailColorCache[email]
}

export default function Car() {
  const { calendarIds } = useApp()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [bookings, setBookings] = useState<CarBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const load = async () => {
    if (!calendarIds) return
    setLoading(true)
    try {
      const bks = await fetchCarBookings(
        calendarIds.car,
        weekStart.toISOString(),
        weekEnd.toISOString()
      )
      setBookings(bks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds, weekStart])

  async function handleDelete(b: CarBooking) {
    if (!calendarIds || !confirm(`Delete booking "${b.purpose}"?`)) return
    setDeleting(b.id)
    try {
      await deleteCarBooking(calendarIds.car, b.id)
      setBookings((prev) => prev.filter((x) => x.id !== b.id))
    } catch (e) {
      alert(String(e))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">🚗 Family Car</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Book
        </button>
      </div>

      {/* Week navigation */}
      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day columns */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayBookings = bookings.filter((b) => isSameDay(new Date(b.start), day))
            const today = isToday(day)
            return (
              <div key={day.toISOString()} className="flex flex-col items-center gap-1">
                <span className={`text-xs font-medium ${today ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {format(day, 'EEE')}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    today ? 'bg-indigo-600 text-white' : 'text-gray-600'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="w-full flex flex-col gap-0.5 min-h-[6px]">
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`h-1.5 rounded-full ${
                        colorForEmail(b.bookedBy).split(' ')[0]
                      }`}
                      title={`${b.bookedByName}: ${b.purpose}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🚗</div>
          <p className="text-gray-500 text-sm">No bookings this week</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
            Book the car →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const color = colorForEmail(b.bookedBy)
            return (
              <div key={b.id} className={`rounded-2xl p-4 shadow-sm border ${color} bg-white`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{b.purpose}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(b.start), 'EEE, MMM d · HH:mm')}
                      {' – '}
                      {format(new Date(b.end), 'HH:mm')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.bookedByName}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(b)}
                    disabled={deleting === b.id}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg flex-shrink-0 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <BookingModal
          existingBookings={bookings}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
