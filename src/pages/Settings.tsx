import { useState } from 'react'
import { LogOut, Calendar, Car, Copy, Check, RefreshCw, Link2 } from 'lucide-react'
import { useApp } from '../App'
import { useLang } from '../App'
import { shareCalendarWithUser, FAMILY_EMAILS } from '../lib/google'

export default function Settings() {
  const { user, calendarIds, setCalendarIds, handleSignOut } = useApp()
  const { lang, setLang, s } = useLang()
  const [eventsId, setEventsId] = useState(calendarIds?.events ?? '')
  const [carId, setCarId] = useState(calendarIds?.car ?? '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<'events' | 'car' | null>(null)
  const [sharing, setSharing] = useState(false)
  const [sharesDone, setSharesDone] = useState(false)
  const [joinLinkCopied, setJoinLinkCopied] = useState(false)

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

  async function copyJoinLink() {
    if (!calendarIds) return
    const encoded = btoa(JSON.stringify(calendarIds))
    const url = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/?join=${encoded}`
    await navigator.clipboard.writeText(url)
    setJoinLinkCopied(true)
    setTimeout(() => setJoinLinkCopied(false), 3000)
  }

  async function reshareAll() {
    if (!calendarIds) return
    setSharing(true)
    try {
      const cals = [calendarIds.events, calendarIds.car, calendarIds.chores].filter(Boolean) as string[]
      await Promise.all(cals.flatMap(id => FAMILY_EMAILS.map(email => shareCalendarWithUser(id, email))))
      setSharesDone(true)
      setTimeout(() => setSharesDone(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-bold text-gray-900">{s.settingsTitle}</h1>
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

      {/* Language toggle */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">{s.language}</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setLang('he')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              lang === 'he' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            עברית
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              lang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Calendar IDs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar size={16} className="text-indigo-600" />
          {s.calendarIdsTitle}
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{s.familyHubLabel}</label>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">{s.familyCarLabel}</label>
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
          {saved ? <><Check size={14} /> {s.saved}</> : <><RefreshCw size={14} /> {s.saveChanges}</>}
        </button>
      </div>

      {/* Family sync */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Link2 size={16} className="text-indigo-600" />
          {lang === 'he' ? 'שיתוף עם המשפחה' : 'Family Sync'}
        </h2>
        <p className="text-sm text-gray-500">
          {lang === 'he'
            ? 'שתף קישור עם שאר בני המשפחה כדי שכולם יתחברו לאותם לוחות שנה'
            : 'Share a link with family members so everyone connects to the same calendars'}
        </p>
        <button
          onClick={copyJoinLink}
          disabled={!calendarIds}
          className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-40"
        >
          {joinLinkCopied ? <><Check size={14} className="text-green-500" /> {lang === 'he' ? 'הועתק!' : 'Copied!'}</> : <><Copy size={14} /> {lang === 'he' ? 'העתק קישור הצטרפות' : 'Copy Join Link'}</>}
        </button>
        <button
          onClick={reshareAll}
          disabled={sharing || !calendarIds}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-40"
        >
          {sharesDone
            ? <><Check size={14} className="text-green-500" /> {lang === 'he' ? 'שותף בהצלחה' : 'Reshared!'}</>
            : sharing
              ? (lang === 'he' ? 'משתף...' : 'Sharing...')
              : <><RefreshCw size={14} /> {lang === 'he' ? 'שתף מחדש עם כל המשפחה' : 'Reshare with all family'}</>}
        </button>
      </div>

      {/* Family sharing tip */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Car size={16} className="text-indigo-600" />
          {s.shareTitle}
        </h2>
        <p className="text-sm text-gray-600">{s.shareInstructions}</p>
        <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
          <li>{s.shareStep1}</li>
          <li>{s.shareStep2}</li>
          <li>{s.shareStep3}</li>
          <li>{s.shareStep4}</li>
        </ol>
        <p className="text-sm text-gray-600">
          {s.shareAccessAt}{' '}
          <span className="font-mono text-xs bg-gray-100 px-1 rounded">amirsharon-cell.github.io/family-hub</span>
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 text-red-600 bg-white rounded-2xl py-3.5 shadow-sm font-medium hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        {s.signOut}
      </button>
    </div>
  )
}
