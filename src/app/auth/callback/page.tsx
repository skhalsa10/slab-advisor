'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/?error=auth_error')
          return
        }

        if (data.session?.user) {
          // Check if user_credits record exists, create if not (for social auth users)
          const { data: existingCredits } = await supabase
            .from('user_credits')
            .select('id')
            .eq('user_id', data.session.user.id)
            .single()

          if (!existingCredits) {
            await supabase
              .from('user_credits')
              .insert({
                user_id: data.session.user.id,
                credits_remaining: 2,
                total_credits_purchased: 0
              })
          }

          router.push('/')
        } else {
          router.push('/?error=no_session')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        router.push('/?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-grey-600">Completing authentication...</p>
      </div>
    </div>
  )
}