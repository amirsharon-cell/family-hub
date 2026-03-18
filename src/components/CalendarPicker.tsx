import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, subMonths, addMonths, isSameDay, isToday, isBefore, startOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  value: Date
  onChange: (date: Date) => void
  minDate?: Date
}

export default function CalendarPicker({ value, onChange, minDate }: Props) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(value))

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  // Monday-first: Sun=0 → pad 6, Mon=1 → pad 0, …
  const startPad = (getDay(startOfMonth(viewMonth)) + 6) % 7

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth(m => subMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(m => addMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
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
