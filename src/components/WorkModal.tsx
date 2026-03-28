import { useState } from 'react'
import { set } from 'date-fns'
import { X } from 'lucide-react'
import { useLang } from '../App'
import type { AssigneeId } from '../types'
import { FAMILY_MEMBERS } from '../types'
import CalendarPicker from './CalendarPicker'

function timeToISO(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  return set(date, { hours: h, minutes: m, seconds: 0, milliseconds: 0 }).toISOString()
}

export default function WorkModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (data: { worker: AssigneeId; start: string; end: string; notes?: string }) => Promise<void>
}) {
  const { lang, s } = useLang()
  const now = new Date()

  const [worker, setWorker] = useState<AssigneeId>('yonatan')
  const [date, setDate] = useState(now)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startISO = timeToISO(date, startTime)
  const endISO = timeToISO(date, endTime)
  const validTimes = new Date(endISO) > new Date(startISO)
  const hours = validTimes
    ? Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 360000) / 10
    : 0

  async function handleSave() {
    if (!validTimes) { setError(s.endAfterStart); return }
    setSaving(true)
    setError('')
    try {
      await onSaved({ worker, start: startISO, end: endISO, notes: notes.trim() || undefined })
    } catch (e) {
      setError(String(e))
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{s.addWorkSession}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Worker selector */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{s.worker}</p>
            <div className="flex gap-2">
              {(Object.entries(FAMILY_MEMBERS) as [AssigneeId, typeof FAMILY_MEMBERS[AssigneeId]][]).map(([id, member]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWorker(id)}
                  className={[
                    'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                    worker === id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : `border-gray-200 ${member.color} hover:border-indigo-300`,
                  ].join(' ')}
                >
                  {lang === 'he' ? member.heName : member.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3">{s.workDate}</p>
            <CalendarPicker value={date} onChange={setDate} />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{s.workFrom}</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{s.workUntil}</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Hours preview */}
          {validTimes && (
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-indigo-700 font-semibold text-sm">
                {s.workHours(hours)} = <span className="text-indigo-600">+{hours} {lang === 'he' ? "נק'" : 'pts'}</span>
              </p>
            </div>
          )}

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={s.workNotesPlaceholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-white">
          <button
            onClick={handleSave}
            disabled={saving || !validTimes}
            className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? s.saving : s.logWork}
          </button>
        </div>
      </div>
    </div>
  )
}
