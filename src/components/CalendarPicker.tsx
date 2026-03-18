import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, subMonths, addMonths, isSameDay, isToday, isBefore, startOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '../App'

interface Props {
  value: Date
  onChange: (date: Date) => void
  minDate?: Date
}

export default function CalendarPicker({ value, onChange, minDate }: Props) {
  const { lang, s } = useLang()
  const [viewMonth, setViewMonth] = useState(startOfMonth(value))

  // Hebrew: prev month is on the right, next is on the left (RTL layout handles position,
  // but we flip the chevron icons so they point in the correct reading direction)
  const isRtl = lang === 'he'
  const monthLabel = `${s.calMonths[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  // Hebrew: Sunday-first (Israeli standard), getDay() returns 0=Sun already
  // English: Monday-first, shift so Mon=0
  const startPad = isRtl
    ? getDay(startOfMonth(viewMonth))
    : (getDay(startOfMonth(viewMonth)) + 6) % 7

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth(m => isRtl ? addMonths(m, 1) : subMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          aria-label={isRtl ? 'חודש הבא' : 'Previous month'}
        >
          {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewMonth(m => isRtl ? subMonths(m, 1) : addMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          aria-label={isRtl ? 'חודש קודם' : 'Next month'}
        >
          {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Day-of-week headers — same dir as the grid so labels align with columns */}
      <div className="grid grid-cols-7 mb-1" dir="ltr">
        {s.calDays.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Day grid — always LTR so the grid layout stays left-to-right */}
      <div className="grid grid-cols-7 gap-y-1" dir="ltr">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const selected = isSameDay(day, value)
          const disabled = minDate ? isBefore(startOfDay(day), startOfDay(minDate)) : false
          const today = isToday(day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(day)}
              className={[
                'flex items-center justify-center mx-auto w-9 h-9 rounded-full text-sm transition-colors',
                selected ? 'bg-indigo-600 text-white font-semibold' : '',
                !selected && today ? 'text-indigo-600 font-bold ring-1 ring-inset ring-indigo-300' : '',
                !selected && !disabled ? 'hover:bg-indigo-50 text-gray-800 cursor-pointer' : '',
                disabled ? 'text-gray-300 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
