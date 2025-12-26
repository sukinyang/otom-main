import { useState } from 'react'
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { useAuth0 } from '@auth0/auth0-react'

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'integrations'

interface Tab {
  id: SettingsTab
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Globe },
]

interface Integration {
  id: string
  name: string
  description: string
  connected: boolean
}

const integrations: Integration[] = [
  { id: 'slack', name: 'Slack', description: 'Receive notifications in Slack', connected: true },
  { id: 'google', name: 'Google Calendar', description: 'Sync consultations with your calendar', connected: false },
  { id: 'salesforce', name: 'Salesforce', description: 'Sync client data with Salesforce', connected: false },
  { id: 'zapier', name: 'Zapier', description: 'Automate workflows with Zapier', connected: true },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations')

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-slate-50 text-slate-800 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'integrations' && <IntegrationSettings integrations={integrations} />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { user } = useAuth0()
  const nameParts = user?.name?.split(' ') || ['', '']
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Profile Information</h3>
      <div className="space-y-4">
        {user?.picture && (
          <div className="flex items-center gap-4 mb-4">
            <img src={user.picture} alt={user.name || 'User'} className="w-16 h-16 rounded-full" />
            <div>
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">Profile managed by Auth0</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input type="text" value={firstName} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input type="text" value={lastName} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={user?.email || ''} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600" />
        </div>
        <p className="text-xs text-slate-500">Profile information is managed through your Auth0 account.</p>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [reportReady, setReportReady] = useState(true)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-slate-900">Email Notifications</p>
            <p className="text-sm text-slate-500">Receive updates via email</p>
          </div>
          <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} className="w-5 h-5 rounded text-slate-900 focus:ring-slate-700" />
        </label>
        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-slate-900">Session Reminders</p>
            <p className="text-sm text-slate-500">Get reminders before scheduled sessions</p>
          </div>
          <input type="checkbox" checked={sessionReminders} onChange={(e) => setSessionReminders(e.target.checked)} className="w-5 h-5 rounded text-slate-900 focus:ring-slate-700" />
        </label>
        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-slate-900">Report Ready</p>
            <p className="text-sm text-slate-500">Notify when reports are generated</p>
          </div>
          <input type="checkbox" checked={reportReady} onChange={(e) => setReportReady(e.target.checked)} className="w-5 h-5 rounded text-slate-900 focus:ring-slate-700" />
        </label>
      </div>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Security</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
          <input type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700" />
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          Update Password
        </button>
      </div>
    </div>
  )
}

function AppearanceSettings() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Appearance</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg cursor-pointer">
              <input type="radio" name="theme" defaultChecked className="text-slate-900" />
              <span className="text-sm">Light</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer">
              <input type="radio" name="theme" className="text-slate-900" />
              <span className="text-sm">Dark</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer">
              <input type="radio" name="theme" className="text-slate-900" />
              <span className="text-sm">System</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationSettings({ integrations }: { integrations: Integration[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-2">Integrations</h3>
      <p className="text-sm text-slate-500 mb-4">Connect with external services</p>
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">{integration.name}</p>
              <p className="text-sm text-slate-500">{integration.description}</p>
            </div>
            <button className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              integration.connected
                ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            )}>
              {integration.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
