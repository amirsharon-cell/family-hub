import { useState } from 'react'
import { LogOut, Calendar, Car, Copy, Check, RefreshCw } from 'lucide-react'
import { useApp } from '../App'

export default function Settings() {
  const { user, calendarIds, setCalendarIds, handleSignOut } = useApp()
  const [eventsId, setEventsId] = useState(calendarIds?.events ?? '')
  const [carId, setCarId] = useState(calendarIds?.car ?? '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<'events' | 'car' | null>(null)

  function save() {
    if (!eventsId.trim() || !carId.trim()) return
    setCalendarIds({ events: eventsId.trim(), car: carId.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function copy(text: string, which: 'events' | 'car') {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
        <img
          src={user?.picture}
          alt={user?.name}
          className="w-14 h-14 rounded-full"
        />
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Calendar IDs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar size={16} className="text-indigo-600" />
          Calendar IDs
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Family Hub (events)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventsId}
              onChange={(e) => setEventsId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              onClick={() => copy(eventsId, 'events')}
              className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"
            >
              {copied === 'events' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Family Car</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              onClick={() => copy(carId, 'car')}
              className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"
            >
              {copied === 'car' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <button
          onClick={save}
          className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? <><Check size={14} /> Saved!</> : <><RefreshCw size={14} /> Save changes</>}
        </button>
      </div>

      {/* Family sharing tip */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Car size={16} className="text-indigo-600" />
          Share with family
        </h2>
        <p className="text-sm text-gray-600">
          For other family members to see and add events, share both calendars with them in Google Calendar:
        </p>
        <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
          <li>Open <strong>Google Calendar</strong></li>
          <li>Find <em>Family Hub</em> and <em>Family Car</em> in the sidebar</li>
          <li>Click the three-dot menu → <strong>Share with specific people</strong></li>
          <li>Add each family member's Gmail and give them <strong>Make changes to events</strong></li>
        </ol>
        <p className="text-sm text-gray-600">
          They then sign in at <span className="font-mono text-xs bg-gray-100 px-1 rounded">amirsharon-cell.github.io/family-hub</span> and the calendars will be auto-detected.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 text-red-600 bg-white rounded-2xl py-3.5 shadow-sm font-medium hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
