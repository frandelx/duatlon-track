import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export function useAuth() {
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signUp(email: string, password: string, username: string, sport: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error || !data.user) return error?.message ?? 'Error al registrarse'
    await supabase.from('profiles').insert({
      id: data.user.id, username, name: username,
      sport, followers_count: 0, following_count: 0, activities_count: 0
    })
    return null
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return
    await supabase.from('profiles').update(updates).eq('id', user.id)
    setProfile(p => p ? {...p, ...updates} : p)
  }

  return { user, profile, loading, signIn, signUp, signOut, updateProfile }
}
