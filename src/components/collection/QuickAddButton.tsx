'use client'

interface QuickAddButtonProps {
  onClick: (e: React.MouseEvent) => void
  className?: string
}

export default function QuickAddButton({ onClick, className = '' }: QuickAddButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(e)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center
        w-8 h-8
        bg-black/60 hover:bg-black/80
        backdrop-blur-sm
        text-white
        rounded-full
        shadow-lg
        opacity-80 hover:opacity-100
        transition-all duration-200
        hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1
        ${className}
      `}
      aria-label="Quick add to collection"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
