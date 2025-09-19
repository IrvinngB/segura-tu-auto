"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { User as DatabaseUser } from "@/lib/types/database"

interface AuthContextType {
  user: User | null
  userProfile: DatabaseUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      // Cache simple en memoria para evitar consultas repetidas
      const cacheKey = `user_profile_${userId}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (cached) {
        const parsed = JSON.parse(cached)
        // Cache válido por 5 minutos
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data
        }
      }

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      // Guardar en cache
      if (data) {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
      }

      return data
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  const refreshUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    } else {
      setUserProfile(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user ?? null)

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUserProfile(profile)
          }
        }

        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      try {
        setUser(session?.user ?? null)

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUserProfile(profile)
          }
        } else {
          if (mounted) {
            setUserProfile(null)
          }
        }

        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in auth state change:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshUser }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
