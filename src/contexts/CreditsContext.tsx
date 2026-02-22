'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { fetchUserCredits } from '@/actions/credits'
import { useAuthState } from '@/contexts/AuthStateContext'
import { supabase } from '@/lib/supabase'
import type { User, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface CreditsContextType {
  credits: number
  user: User | null
  refreshCredits: () => Promise<void>
  loading: boolean
  isRealtimeConnected: boolean
}

interface UserCreditsRow {
  id: string
  user_id: string
  credits_remaining: number
  total_credits_purchased: number
  created_at: string
  updated_at: string
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const authState = useAuthState()
  const contextUser = authState?.user ?? null

  const [credits, setCredits] = useState(0)
  const [user, setUser] = useState<User | null>(contextUser)
  const [loading, setLoading] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  // Sync with auth context changes (login/logout)
  useEffect(() => {
    setUser(contextUser)
    if (!contextUser) {
      setCredits(0)
      setLoading(false)
    }
  }, [contextUser])

  const refreshCredits = useCallback(async () => {
    try {
      if (user) {
        const userCredits = await fetchUserCredits()
        setCredits(userCredits)
      } else {
        setCredits(0)
      }
    } catch {
      setCredits(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch credits when user changes
  useEffect(() => {
    if (user) {
      refreshCredits()
    }
  }, [user, refreshCredits])

  // Set up realtime subscription for credit changes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`user-credits-${user.id}`)
      .on<UserCreditsRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<UserCreditsRow>) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setCredits(payload.new.credits_remaining)
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setCredits(payload.new.credits_remaining)
          } else if (payload.eventType === 'DELETE') {
            setCredits(0)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
        } else if (status === 'CLOSED') {
          setIsRealtimeConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false)
        }
      })

    return () => {
      setIsRealtimeConnected(false)
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <CreditsContext.Provider value={{ credits, user, refreshCredits, loading, isRealtimeConnected }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}
