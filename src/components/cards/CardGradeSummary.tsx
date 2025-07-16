import React, { memo } from 'react'
import { Card } from '@/types/database'

interface CardGradeSummaryProps {
  card: Card
}

const CardGradeSummary = memo(function CardGradeSummary({ card }: CardGradeSummaryProps) {
  const getGradeColor = (grade: number | null): string => {
    if (!grade) return 'bg-grey-100 text-grey-800'
    if (grade >= 9) return 'bg-green-100 text-green-800'
    if (grade >= 7) return 'bg-yellow-100 text-yellow-800'
    if (grade >= 5) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return 'Not graded'
    return `${grade}/10`
  }

  const formatConfidence = (confidence: number | null): string => {
    if (confidence === null) return 'N/A'
    return `${Math.round(confidence * 100)}%`
  }

  // Extract detailed grades from grading_details if available
  const getDetailedGrades = () => {
    if (!card.grading_details) return null
    
    try {
      const details = card.grading_details as Record<string, unknown>
      const ximilarResponse = details.ximilar_response as Record<string, unknown>
      const records = ximilarResponse?.records as unknown[]
      
      if (Array.isArray(records) && records.length > 0) {
        const firstRecord = records[0] as Record<string, unknown>
        return firstRecord?.grades as Record<string, number> | null
      }
    } catch {
      // Ignore parsing errors
    }
    
    return null
  }

  const detailedGrades = getDetailedGrades()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-grey-900 mb-4">Grade Summary</h3>
      
      {/* Overall Grade */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-grey-700">Overall Grade</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(card.estimated_grade)}`}>
            {formatGrade(card.estimated_grade)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-grey-600">Confidence</span>
          <span className="text-sm text-grey-900">{formatConfidence(card.confidence)}</span>
        </div>
      </div>

      {/* Detailed Grades */}
      {detailedGrades && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-grey-900">Detailed Breakdown</h4>
          
          <div className="grid grid-cols-2 gap-3">
            {detailedGrades.corners && (
              <div className="bg-grey-50 rounded-lg p-3">
                <div className="text-xs font-medium text-grey-600 mb-1">Corners</div>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGradeColor(detailedGrades.corners)}`}>
                  {formatGrade(detailedGrades.corners)}
                </div>
              </div>
            )}
            
            {detailedGrades.edges && (
              <div className="bg-grey-50 rounded-lg p-3">
                <div className="text-xs font-medium text-grey-600 mb-1">Edges</div>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGradeColor(detailedGrades.edges)}`}>
                  {formatGrade(detailedGrades.edges)}
                </div>
              </div>
            )}
            
            {detailedGrades.surface && (
              <div className="bg-grey-50 rounded-lg p-3">
                <div className="text-xs font-medium text-grey-600 mb-1">Surface</div>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGradeColor(detailedGrades.surface)}`}>
                  {formatGrade(detailedGrades.surface)}
                </div>
              </div>
            )}
            
            {detailedGrades.centering && (
              <div className="bg-grey-50 rounded-lg p-3">
                <div className="text-xs font-medium text-grey-600 mb-1">Centering</div>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGradeColor(detailedGrades.centering)}`}>
                  {formatGrade(detailedGrades.centering)}
                </div>
              </div>
            )}
          </div>

          {detailedGrades.condition && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs font-medium text-blue-800 mb-1">Condition</div>
              <div className="text-sm text-blue-900">{detailedGrades.condition}</div>
            </div>
          )}
        </div>
      )}

      {/* No Grade State */}
      {!card.estimated_grade && (
        <div className="text-center py-4">
          <div className="text-grey-400 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-grey-600">This card hasn&apos;t been graded yet</p>
        </div>
      )}
    </div>
  )
})

export default CardGradeSummary