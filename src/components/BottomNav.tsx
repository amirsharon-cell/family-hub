import { NavLink } from 'react-router-dom'
import { Home, Calendar, Car, Settings, ClipboardList } from 'lucide-react'
import { useLang } from '../App'

export default function BottomNav() {
  const { s } = useLang()

  const tabs = [
    { to: '/', icon: Home, label: s.navHome },
    { to: '/events', icon: Calendar, label: s.navEvents },
    { to: '/chores', icon: ClipboardList, label: s.navChores },
    { to: '/car', icon: Car, label: s.navCar },
    { to: '/settings', icon: Settings, label: s.navSettings },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
