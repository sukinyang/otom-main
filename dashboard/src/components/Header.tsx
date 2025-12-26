import { Bell, Search, User } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'

export default function Header() {
  const { user } = useAuth0()

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search sessions, reports..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent transition-all"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          {user?.picture ? (
            <img src={user.picture} alt={user.name || 'User'} className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
              <User size={18} className="text-slate-600" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
