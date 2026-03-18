import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { initAuth, getUserInfo, signOut as gSignOut } from './lib/google'
import type { User, CalendarIds } from './types'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Events from './pages/Events'
import Car from './pages/Car'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  user: User | null
  token: string | null
  calendarIds: CalendarIds | null
  setCalendarIds: (ids: CalendarIds) => void
  handleSignOut: () => void
}

const AppContext = createContext<AppContextType>({} as AppContextType)
export const useApp = () => useContext(AppContext)

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [calendarIds, setCalendarIdsState] = useState<CalendarIds | null>(() => {
    try {
      const saved = localStorage.getItem('family-hub-calendars')
      return saved ? (JSON.parse(saved) as CalendarIds) : null
    } catch {
      return null
    }
  })

  const onToken = useCallback(async (newToken: string | null) => {
    if (newToken) {
      setToken(newToken)
      try {
        const info = await getUserInfo()
        setUser(info)
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

  return (
    <AppContext.Provider value={{ user, token, calendarIds, setCalendarIds, handleSignOut }}>
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
  )
}
