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
  clearAllCache: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      const cacheKey = `user_profile_${userId}`
      const cached = sessionStorage.getItem(cacheKey)

      if (cached) {
        const parsed = JSON.parse(cached)
        // Cache valid for 10 minutes (increased from 5)
        if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
          console.log("✅ Using cached user profile")
          return parsed.data
        }
        console.log("⏰ Cache expired, fetching fresh data")
      }

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      if (!data) {
        console.warn(`User profile not found for user ID: ${userId}`)
        return null
      }

      // Save to cache
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )

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

  const clearAllCache = () => {
    try {
      // Clear sessionStorage cache
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes("user_profile_") || key.includes("customer_data_") || key.includes("supabase"))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key))

      // Clear localStorage cache
      const localStorageKeysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes("sb-") || key.includes("supabase"))) {
          localStorageKeysToRemove.push(key)
        }
      }
      localStorageKeysToRemove.forEach((key) => localStorage.removeItem(key))

      const cookiesToClear = [
        "sb-sztuxibgvlwbykaopnqg-auth-token",
        "sb-sztuxibgvlwbykaopnqg-auth-token-code-verifier",
        "sb-auth-token",
        "supabase-auth-token",
      ]

      cookiesToClear.forEach((cookieName) => {
        // Clear for different path and domain combinations
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost`
      })

      console.log("✅ Cache cleared completely")
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase first
      await supabase.auth.signOut()

      // Then clear all cache
      clearAllCache()

      // Clear local state
      setUser(null)
      setUserProfile(null)

      console.log("✅ Session closed and cache cleared completely")
    } catch (error) {
      console.error("Error signing out:", error)
      // Still clear local state
      setUser(null)
      setUserProfile(null)
    }
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
          // Fetch profile in background, show UI faster
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUserProfile(profile)
          }
        }

        // Set loading to false earlier to show UI
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
        if (event === "SIGNED_OUT") {
          clearAllCache()
        }

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
      } catch (error) {
        console.error("Error in auth state change:", error)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshUser, clearAllCache }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
