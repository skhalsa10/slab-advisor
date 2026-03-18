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
    <div className={`border-b border-border ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-secondary text-xs text-muted-foreground">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}