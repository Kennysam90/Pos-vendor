import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  display_name: string
  phone: string | null
  business_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'phone' | 'business_name' | 'avatar_url'>>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (error) {
      console.error('Profile load error:', error.message)
      return
    }
    setProfile(data as Profile | null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        (async () => {
          await loadProfile(data.session!.user.id)
          setLoading(false)
        })()
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession)
        if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
          await loadProfile(newSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
        setLoading(false)
      })()
    })

    return () => { sub.subscription.unsubscribe() }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) return { error: error.message }
    if (data.user) {
      await loadProfile(data.user.id)
    }
    return { error: null }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const updateProfile = useCallback(async (patch: Partial<Pick<Profile, 'display_name' | 'phone' | 'business_name' | 'avatar_url'>>) => {
    if (!session?.user) return { error: 'Not signed in' }
    const { error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (error) return { error: error.message }
    await loadProfile(session.user.id)
    return { error: null }
  }, [session, loadProfile])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, profile, loading,
      signIn, signUp, signOut, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
