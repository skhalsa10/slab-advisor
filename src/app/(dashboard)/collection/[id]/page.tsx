'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import CardDetails from '@/components/cards/CardDetails'

interface CardPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CardPage({ params }: CardPageProps) {
  const router = useRouter()
  const { id } = use(params)

  const handleBack = () => {
    router.push('/collection')
  }

  return (
    <CardDetails 
      cardId={id} 
      onBack={handleBack} 
    />
  )
}