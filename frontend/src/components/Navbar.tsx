import { NavLink } from 'react-router-dom'
import {
  RiBookOpenLine,
  RiBookmark3Line,
  RiSearchLine,
  RiSettings3Line,
  RiStackLine,
} from 'react-icons/ri'
import type { IconType } from 'react-icons'
import { useAuth } from '../auth/AuthContext'

interface NavItem {
  to: string
  label: string
  en: string
  icon: IconType
}

const navItems: NavItem[] = [
  { to: '/', label: '阅读', en: 'Reader', icon: RiBookOpenLine },
  { to: '/dictionary', label: '词典', en: 'Dictionary', icon: RiSearchLine },
  { to: '/decks', label: '卡组', en: 'Decks', icon: RiStackLine },
  { to: '/library', label: '书库', en: 'Library', icon: RiBookmark3Line },
  { to: '/settings', label: '设置', en: 'Settings', icon: RiSettings3Line },
]

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="w-nav min-w-nav h-screen sticky top-0 bg-white border-r border-ink-50 flex flex-col px-4 py-6 gap-2">
      <div className="flex items-center gap-2.5 px-2 pb-5 border-b border-ink-50 mb-2">
        <span className="w-10 h-10 rounded-md bg-red-600 text-white flex items-center justify-center text-xl font-bold font-display shrink-0">
          汉
        </span>
        <div>
          <div className="font-semibold text-sm text-ink-900">HanziPath</div>
          <div className="text-xs text-ink-400">Chinese Reader</div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ to, label, en, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-md no-underline transition-colors duration-150 ` +
              (isActive
                ? 'bg-red-50 text-red-800'
                : 'text-ink-400 hover:bg-ink-0 hover:text-ink-900')
            }
          >
            <span className="w-6 flex justify-center text-lg">
              <Icon />
            </span>
            <div>
              <div className="text-sm font-bold font-display leading-tight">{label}</div>
              <div className="text-xs opacity-70">{en}</div>
            </div>
          </NavLink>
        ))}
      </div>

      <div className="border-t border-ink-50 pt-4">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="px-3 py-2 bg-gold-50 rounded-md">
              <div className="font-semibold text-sm text-gold-800 truncate">{user.email}</div>
              <div className="text-xs text-gold-600">Signed in</div>
            </div>
            <button
              className="btn-quiet text-xs text-left px-3 py-2 rounded-md"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <NavLink
            to="/auth"
            className="block px-3 py-2 bg-gold-50 rounded-md text-sm font-medium text-gold-800 no-underline transition-colors duration-150 hover:bg-gold-50/70"
          >
            Sign in
          </NavLink>
        )}
      </div>
    </nav>
  )
}
