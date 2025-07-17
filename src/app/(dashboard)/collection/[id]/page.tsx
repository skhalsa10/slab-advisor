'use client'

import { useRouter } from 'next/navigation'
import CardDetails from '@/components/cards/CardDetails'

interface CardPageProps {
  params: {
    id: string
  }
}

export default function CardPage({ params }: CardPageProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/collection')
  }

  return (
    <CardDetails 
      cardId={params.id} 
      onBack={handleBack} 
    />
  )
}