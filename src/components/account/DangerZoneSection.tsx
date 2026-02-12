import { AlertTriangle } from 'lucide-react'

export default function DangerZoneSection() {
  return (
    <div className="bg-white rounded-lg border border-red-200 mb-6">
      <div className="px-4 py-3 border-b border-red-200 bg-red-50">
        <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-grey-600">
          Account deletion and data management options coming soon.
        </p>
      </div>
    </div>
  )
}
