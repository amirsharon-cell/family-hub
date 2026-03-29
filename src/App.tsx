import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { initAuth, getUserInfo, signOut as gSignOut, HINT_KEY } from './lib/google'
import { getStrings } from './lib/i18n'
import type { Lang, Strings } from './lib/i18n'
import type { User, CalendarIds } from './types'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Events from './pages/Events'
import Car from './pages/Car'
import Settings from './pages/Settings'
import Chores from './pages/Chores'
import BottomNav from './components/BottomNav'

// ─── App context ──────────────────────────────────────────────────────────────

interface AppContextType {
  user: User | null
  token: string | null
  calendarIds: CalendarIds | null
  setCalendarIds: (ids: CalendarIds) => void
  handleSignOut: () => void
  refreshSignal: number
}

const AppContext = createContext<AppContextType>({} as AppContextType)
export const useApp = () => useContext(AppContext)

// ─── Language context ─────────────────────────────────────────────────────────

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  s: Strings
}

const LangContext = createContext<LangContextType>({} as LangContextType)
export const useLang = () => useContext(LangContext)

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const [calendarIds, setCalendarIdsState] = useState<CalendarIds | null>(() => {
    try {
      const saved = localStorage.getItem('family-hub-calendars')
      return saved ? (JSON.parse(saved) as CalendarIds) : null
    } catch {
      return null
    }
  })
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('family-hub-lang')
    if (saved === 'en' || saved === 'he') return saved
    // Default to Hebrew, or match browser language
    return navigator.language.startsWith('he') ? 'he' : 'he'
  })

  // Apply dir + lang to the document whenever language changes
  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('family-hub-lang', l)
  }

  const onToken = useCallback(async (newToken: string | null) => {
    if (newToken) {
      setToken(newToken)
      try {
        const info = await getUserInfo()
        setUser(info)
        localStorage.setItem(HINT_KEY, info.email)
      } catch {
        setUser(null)
      }
    } else {
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    initAuth(onToken).finally(() => setAuthReady(true))
  }, [onToken])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinParam = params.get('join')
    if (joinParam) {
      try {
        const ids = JSON.parse(atob(joinParam)) as CalendarIds
        if (ids.events && ids.car) {
          setCalendarIds(ids)
          // Clean up the URL
          window.history.replaceState({}, '', window.location.pathname)
        }
      } catch { /* ignore invalid param */ }
    }
  }, [])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setRefreshSignal(n => n + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  function setCalendarIds(ids: CalendarIds) {
    setCalendarIdsState(ids)
    localStorage.setItem('family-hub-calendars', JSON.stringify(ids))
  }

  function handleSignOut() {
    gSignOut()
    setToken(null)
    setUser(null)
  }

  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  const s = getStrings(lang)

  return (
    <LangContext.Provider value={{ lang, setLang, s }}>
      <AppContext.Provider value={{ user, token, calendarIds, setCalendarIds, handleSignOut, refreshSignal }}>
        <BrowserRouter basename={basename}>
          {!token ? (
            <Routes>
              <Route path="*" element={<Login />} />
            </Routes>
          ) : !calendarIds ? (
            <Routes>
              <Route path="*" element={<Setup />} />
            </Routes>
          ) : (
            <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative">
              <div className="flex-1 overflow-y-auto pb-20">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/chores" element={<Chores />} />
                  <Route path="/car" element={<Car />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <BottomNav />
            </div>
          )}
        </BrowserRouter>
      </AppContext.Provider>
      {needRefresh && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-indigo-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-3">
          <span>{lang === 'he' ? 'עדכון זמין' : 'Update available'}</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="underline font-medium"
          >
            {lang === 'he' ? 'טען מחדש' : 'Reload'}
          </button>
        </div>
      )}
    </LangContext.Provider>
  )
}
