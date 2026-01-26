'use client'

export default function EmptySealedState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-grey-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>

      <h3 className="mt-2 text-sm font-medium text-grey-900">
        No sealed products yet
      </h3>
      <p className="mt-1 text-sm text-grey-500">
        Sealed products will appear here once added. Browse sets to add products
        to your collection.
      </p>
    </div>
  )
}
