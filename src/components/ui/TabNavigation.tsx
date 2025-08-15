interface Tab {
  id: string
  label: string
  count?: number
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = ""
}: TabNavigationProps) {
  return (
    <div className={`border-b border-grey-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-grey-500 hover:text-grey-700 hover:border-grey-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-grey-100 text-xs text-grey-600">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}