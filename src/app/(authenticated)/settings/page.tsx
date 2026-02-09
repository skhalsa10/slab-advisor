import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <Settings className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-grey-900">Settings</h1>
          <p className="text-grey-600 text-sm">Manage your account settings</p>
        </div>
      </div>

      <div className="bg-grey-50 rounded-lg p-8 text-center border border-grey-200">
        <p className="text-grey-600">
          Account settings and billing options coming soon.
        </p>
      </div>
    </div>
  )
}
