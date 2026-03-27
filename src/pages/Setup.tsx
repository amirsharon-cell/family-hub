import { useState } from 'react'
import { listCalendars, createCalendar, shareCalendarWithUser, FAMILY_EMAILS } from '../lib/google'
import { useApp } from '../App'
import { useLang } from '../App'

type Step = 'scan' | 'found' | 'create' | 'manual'

interface Found {
  events: string
  car: string
  chores?: string
}

export default function Setup() {
  const { user, setCalendarIds, handleSignOut } = useApp()
  const { s } = useLang()
  const [step, setStep] = useState<Step>('scan')
  const [found, setFound] = useState<Found | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualEvents, setManualEvents] = useState('')
  const [manualCar, setManualCar] = useState('')

  async function scan() {
    setLoading(true)
    setError('')
    try {
      const cals = await listCalendars()
      const evCal = cals.find((c) => c.summary === 'Family Hub')
      const carCal = cals.find((c) => c.summary === 'Family Car')
      const choresCal = cals.find((c) => c.summary === 'Family Chores')
      if (evCal && carCal) {
        setFound({ events: evCal.id, car: carCal.id, chores: choresCal?.id })
        setStep('found')
      } else {
        setStep('create')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function createCalendars() {
    setLoading(true)
    setError('')
    try {
      const cals = await listCalendars()
      let evId = cals.find((c) => c.summary === 'Family Hub')?.id
      let carId = cals.find((c) => c.summary === 'Family Car')?.id
      let choresId = cals.find((c) => c.summary === 'Family Chores')?.id
      if (!evId) {
        const ev = await createCalendar('Family Hub', 'Shared family events')
        evId = ev.id
      }
      if (!carId) {
        const car = await createCalendar('Family Car', 'Family car bookings')
        carId = car.id
      }
      if (!choresId) {
        const chores = await createCalendar('Family Chores', 'Family home chores and tasks')
        choresId = chores.id
        // Auto-share with all family members
        await Promise.all(FAMILY_EMAILS.map(email => shareCalendarWithUser(choresId!, email)))
      }
      setCalendarIds({ events: evId, car: carId, chores: choresId })
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function applyManual() {
    if (!manualEvents.trim() || !manualCar.trim()) {
      setError('Please enter both calendar IDs.')
      return
    }
    setCalendarIds({ events: manualEvents.trim(), car: manualCar.trim() })
  }

  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📅</div>
          <h1 className="text-xl font-bold text-gray-900">{s.setUpTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{s.setUpSubtitle(firstName)}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        {step === 'scan' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{s.calendarDesc}</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li><strong>Family Hub</strong> – {s.calFamilyHub}</li>
              <li><strong>Family Car</strong> – {s.calFamilyCar}</li>
            </ul>
            <button
              onClick={scan}
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? s.scanning : s.scanCalendars}
            </button>
            <button
              onClick={() => setStep('manual')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              {s.enterManually}
            </button>
          </div>
        )}

        {step === 'found' && found && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 space-y-2">
              <p className="text-green-700 font-medium text-sm">{s.foundCalendars}</p>
              <p className="text-xs text-green-600 break-all">Family Hub: {found.events}</p>
              <p className="text-xs text-green-600 break-all">Family Car: {found.car}</p>
            </div>
            <button
              onClick={() => setCalendarIds(found)}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 transition-colors"
            >
              {s.connectOpen}
            </button>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{s.noCalendarsFound}</p>
            <button
              onClick={createCalendars}
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? s.creating : s.createCalendars}
            </button>
            <button
              onClick={() => setStep('manual')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              {s.haveIds}
            </button>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{s.familyHubId}</label>
              <input
                type="text"
                value={manualEvents}
                onChange={(e) => setManualEvents(e.target.value)}
                placeholder="xxxxx@group.calendar.google.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{s.familyCarId}</label>
              <input
                type="text"
                value={manualCar}
                onChange={(e) => setManualCar(e.target.value)}
                placeholder="xxxxx@group.calendar.google.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={applyManual}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 transition-colors"
            >
              {s.connect}
            </button>
            <button
              onClick={() => setStep('scan')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              {s.back}
            </button>
          </div>
        )}

        <button onClick={handleSignOut} className="mt-6 w-full text-xs text-gray-400 hover:text-gray-600">
          {s.signOut}
        </button>
      </div>
    </div>
  )
}
