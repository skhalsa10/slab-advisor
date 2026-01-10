'use client'

interface GradingResult {
  id: string
  grade_final: number
  grade_corners: number
  grade_edges: number
  grade_surface: number
  grade_centering: number
  condition: string
  front_centering_lr: string
  front_centering_tb: string
  back_centering_lr: string
  back_centering_tb: string
}

interface GradingResultViewProps {
  /** The grading result from the API */
  gradingResult: GradingResult
  /** Card name for display */
  cardName: string
  /** Called when user closes the result view */
  onClose: () => void
}

/**
 * Displays grading results after AI analysis
 *
 * Shows final grade prominently, breakdown of component grades,
 * centering information, and condition label.
 */
export default function GradingResultView({
  gradingResult,
  cardName,
  onClose,
}: GradingResultViewProps) {
  const { grade_final, grade_corners, grade_edges, grade_surface, grade_centering, condition } =
    gradingResult

  // Determine grade color based on value
  const getGradeColor = (grade: number) => {
    if (grade >= 9) return 'text-green-600'
    if (grade >= 7) return 'text-yellow-600'
    return 'text-orange-600'
  }

  // Format grade for display (e.g., 8.5 or 9.0)
  const formatGrade = (grade: number) => {
    return grade % 1 === 0 ? grade.toFixed(0) : grade.toFixed(1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-grey-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-grey-900">Grading Results</h2>
        <button
          onClick={onClose}
          className="text-grey-400 hover:text-grey-600 transition-colors p-1"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Card name */}
        <p className="text-center text-grey-600 font-medium">{cardName}</p>

        {/* Final grade - prominent display */}
        <div className="text-center py-6">
          <div className="inline-flex flex-col items-center">
            <span className="text-sm text-grey-500 uppercase tracking-wide mb-1">
              Estimated Grade
            </span>
            <span className={`text-6xl font-bold ${getGradeColor(grade_final)}`}>
              {formatGrade(grade_final)}
            </span>
            <span className="mt-2 px-3 py-1 bg-grey-100 text-grey-700 text-sm font-medium rounded-full">
              {condition}
            </span>
          </div>
        </div>

        {/* Grade breakdown */}
        <div className="bg-grey-50 rounded-lg p-4 space-y-3">
          <p className="text-xs text-grey-500 font-medium uppercase tracking-wide">
            Grade Breakdown
          </p>

          {/* Component grades */}
          <div className="space-y-2">
            <GradeRow label="Corners" grade={grade_corners} />
            <GradeRow label="Edges" grade={grade_edges} />
            <GradeRow label="Surface" grade={grade_surface} />
            <GradeRow label="Centering" grade={grade_centering} />
          </div>
        </div>

        {/* Centering details */}
        <div className="bg-grey-50 rounded-lg p-4 space-y-3">
          <p className="text-xs text-grey-500 font-medium uppercase tracking-wide">
            Centering Details
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Front centering */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-grey-700">Front</p>
              <p className="text-xs text-grey-500">
                L/R: {gradingResult.front_centering_lr || 'N/A'}
              </p>
              <p className="text-xs text-grey-500">
                T/B: {gradingResult.front_centering_tb || 'N/A'}
              </p>
            </div>

            {/* Back centering */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-grey-700">Back</p>
              <p className="text-xs text-grey-500">
                L/R: {gradingResult.back_centering_lr || 'N/A'}
              </p>
              <p className="text-xs text-grey-500">
                T/B: {gradingResult.back_centering_tb || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-grey-400 text-center">
          This is an AI-estimated grade and may differ from actual PSA grading results.
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-grey-200 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

/**
 * Individual grade row component
 */
function GradeRow({ label, grade }: { label: string; grade: number }) {
  const getGradeColor = (grade: number) => {
    if (grade >= 9) return 'text-green-600'
    if (grade >= 7) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const formatGrade = (grade: number) => {
    return grade % 1 === 0 ? grade.toFixed(0) : grade.toFixed(1)
  }

  // Calculate progress bar width (grade is 1-10 scale)
  const progressWidth = (grade / 10) * 100

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-grey-600 w-20">{label}</span>
      <div className="flex-1 h-2 bg-grey-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            grade >= 9 ? 'bg-green-500' : grade >= 7 ? 'bg-yellow-500' : 'bg-orange-500'
          }`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      <span className={`text-sm font-medium w-8 text-right ${getGradeColor(grade)}`}>
        {formatGrade(grade)}
      </span>
    </div>
  )
}
