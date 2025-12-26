import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  MessageSquare,
  FileText,
  Map,
  FileBarChart,
  GitBranch,
  Lightbulb,
  Users,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const mainNavItems = [
  { path: '/overview', label: 'Overview', icon: LayoutGrid },
  { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/consultations', label: 'Consultations', icon: FileText },
  { path: '/process-maps', label: 'Process Maps', icon: Map },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
]

const secondaryNavItems = [
  { path: '/processes', label: 'Processes', icon: GitBranch },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
]

const bottomNavItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/help', label: 'Help', icon: HelpCircle },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={clsx(
      'bg-white text-slate-900 flex flex-col transition-all duration-300 border-r border-slate-200',
      collapsed ? 'w-20' : 'w-56'
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <img
              src="/otom-icon.svg"
              alt="Otom"
              className="w-8 h-8"
            />
          ) : (
            <img
              src="/otom-logo-black.png"
              alt="Otom"
              className="h-7"
            />
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={18} className={clsx('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {mainNavItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="my-4 border-t border-slate-200" />

        {secondaryNavItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-2 border-t border-slate-200 space-y-1">
        {bottomNavItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
