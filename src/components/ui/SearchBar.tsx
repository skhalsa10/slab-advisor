interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function SearchBar({ 
  placeholder = "Search...", 
  value, 
  onChange,
  className = ""
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
      <svg
        className="absolute left-3 top-2.5 w-5 h-5 text-grey-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  )
}