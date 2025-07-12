'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, getUserCredits } from '@/lib/auth'
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
  const [credits, setCredits] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const refreshCredits = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        const userCredits = await getUserCredits(currentUser.id)
        setCredits(userCredits)
        setUser(currentUser)
      } else {
        setCredits(0)
        setUser(null)
      }
    } catch {
      setCredits(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCredits()
  }, [])

  // Set up realtime subscription for credit changes
  useEffect(() => {
    if (!user) return

    // Set up realtime subscription for credit changes

    // Create a channel for this user's credits
    const channel = supabase
      .channel(`user-credits-${user.id}`)
      .on<UserCreditsRow>(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<UserCreditsRow>) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Update credits when database changes
            setCredits(payload.new.credits_remaining)
          } else if (payload.eventType === 'INSERT' && payload.new) {
            // Handle new credit record
            setCredits(payload.new.credits_remaining)
          } else if (payload.eventType === 'DELETE') {
            // Handle credit record deletion (shouldn't happen normally)
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

    // Cleanup subscription on unmount or user change
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