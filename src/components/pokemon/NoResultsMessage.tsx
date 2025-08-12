interface NoResultsMessageProps {
  seriesSearchQuery?: string
  setSearchQuery?: string
}

export default function NoResultsMessage({ 
  seriesSearchQuery = '', 
  setSearchQuery = '' 
}: NoResultsMessageProps) {
  const getMessage = () => {
    if (seriesSearchQuery || setSearchQuery) {
      let message = 'No results found'
      if (seriesSearchQuery) {
        message += ` for series "${seriesSearchQuery}"`
      }
      if (seriesSearchQuery && setSearchQuery) {
        message += ' and'
      }
      if (setSearchQuery) {
        message += ` for sets "${setSearchQuery}"`
      }
      return message
    }
    return 'No series or sets found'
  }

  return (
    <div className="text-center py-8">
      <p className="text-grey-600">{getMessage()}</p>
    </div>
  )
}