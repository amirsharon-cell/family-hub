import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  startOfWeek, endOfWeek, addDays, subDays,
  addMonths, subMonths, isToday, isSameDay, startOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { fetchCarBookings, deleteCarBooking } from '../lib/google'
import { useApp, useLang } from '../App'
import type { CarBooking } from '../types'
import { CAR_OPTIONS } from '../types'
import BookingModal from '../components/BookingModal'

type ViewMode = 'day' | 'week' | 'month'

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
  const { lang, s } = useLang()
  const isRtl = lang === 'he'
  const weekStartsOn = (isRtl ? 0 : 1) as 0 | 1

  const today = startOfDay(new Date())
  const [view, setView] = useState<ViewMode>('week')
  const [selectedDay, setSelectedDay] = useState(today)
  const [navDate, setNavDate] = useState(today)
  const [bookings, setBookings] = useState<CarBooking[]>([])
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
      const bks = await fetchCarBookings(calendarIds.car, start.toISOString(), end.toISOString())
      setBookings(bks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [calendarIds, view, navDate])

  async function handleDelete(b: CarBooking) {
    if (!calendarIds || !confirm(s.deleteBooking(b.purpose))) return
    setDeleting(b.id)
    try {
      await deleteCarBooking(calendarIds.car, b.id)
      setBookings(prev => prev.filter(x => x.id !== b.id))
    } catch (e) {
      alert(String(e))
    } finally {
      setDeleting(null)
    }
  }

  function changeView(v: ViewMode) {
    setView(v)
    setNavDate(selectedDay)
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

  function bookingsOnDay(day: Date) {
    return bookings.filter(b => isSameDay(new Date(b.start), day))
  }

  const dayBookings = bookings.filter(b => isSameDay(new Date(b.start), selectedDay))

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

  const weekStartDate = startOfWeek(navDate, { weekStartsOn })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i))
  const monthDays = eachDayOfInterval({ start: startOfMonth(navDate), end: endOfMonth(navDate) })
  const startPad = isRtl
    ? getDay(startOfMonth(navDate))
    : (getDay(startOfMonth(navDate)) + 6) % 7

  function DayBtn({ day }: { day: Date }) {
    const bks = bookingsOnDay(day)
    const selected = isSameDay(day, selectedDay)
    const todayDay = isToday(day)
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={() => setSelectedDay(startOfDay(day))}
          className={[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
            selected ? 'bg-indigo-600 text-white' : '',
            !selected && todayDay ? 'text-indigo-600 font-bold ring-1 ring-inset ring-indigo-300' : '',
            !selected && !todayDay ? 'text-gray-600 hover:bg-indigo-50' : '',
          ].join(' ')}
        >
          {format(day, 'd')}
        </button>
        <div className="w-full flex flex-col gap-0.5 min-h-[6px]">
          {bks.slice(0, 3).map(b => (
            <div
              key={b.id}
              className={`h-1.5 rounded-full ${colorForEmail(b.bookedBy).split(' ')[0]}`}
              title={`${b.bookedByName}: ${b.purpose}`}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">{s.carPageTitle}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> {s.bookCar}
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
      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="text-sm font-semibold text-gray-700">{navTitle}</span>
          <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {view === 'day' && (
          <p className="text-center text-sm text-gray-500 py-1">
            {dayBookings.length === 0
              ? s.noBookings
              : `${dayBookings.length} ${lang === 'he' ? (dayBookings.length === 1 ? 'הזמנה' : 'הזמנות') : (dayBookings.length === 1 ? 'booking' : 'bookings')}`
            }
          </p>
        )}

        {(view === 'week' || view === 'month') && (
          <div className="grid grid-cols-7 mb-1" dir="ltr">
            {s.calDays.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
            ))}
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-1" dir="ltr">
            {weekDays.map(day => <DayBtn key={day.toISOString()} day={day} />)}
          </div>
        )}

        {view === 'month' && (
          <div className="grid grid-cols-7 gap-y-1" dir="ltr">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {monthDays.map(day => <DayBtn key={day.toISOString()} day={day} />)}
          </div>
        )}
      </div>

      {view !== 'day' && (
        <p className="text-sm font-semibold text-gray-700">{selectedLabel}</p>
      )}

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />)}
        </div>
      ) : dayBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🚗</div>
          <p className="text-gray-500 text-sm">{s.noBookings}</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800">
            {s.bookTheCarArrow}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {dayBookings.map(b => {
            const color = colorForEmail(b.bookedBy)
            const carOption = CAR_OPTIONS.find(c => c.id === b.carId) ?? CAR_OPTIONS[0]
            return (
              <div key={b.id} className={`rounded-2xl p-4 shadow-sm border ${color} bg-white`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">{carOption.emoji}</span>
                      <span className="text-xs font-semibold text-gray-700">{carOption.label}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{b.purpose}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(b.start), 'HH:mm')} – {format(new Date(b.end), 'HH:mm')}
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
