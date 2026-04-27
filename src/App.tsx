import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { TabBar } from '@/components/layout/TabBar'
import { AuthPage }         from '@/pages/AuthPage'
import { FeedPage }         from '@/pages/FeedPage'
import { MapPage }          from '@/pages/MapPage'
import { RecordPage }       from '@/pages/RecordPage'
import { ExplorePage }      from '@/pages/ExplorePage'
import { ProfilePage }      from '@/pages/ProfilePage'
import { NotificationsPage, MessagesPage, SettingsPage } from '@/pages/ExtraPages'
import type { Screen, Profile } from '@/types'

type Modal = 'notifs' | 'messages' | 'settings' | 'athlete'

interface SubScreen {
  modal:    Modal
  profile?: Profile
  userId?:  string
}

export default function App() {
  const { user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth()
  const [screen, setScreen] = useState<Screen>('feed')
  const [sub, setSub]       = useState<SubScreen|null>(null)
  const [viewedProfile, setViewedProfile] = useState<Profile|null>(null)

  // Loading splash
  if (loading) return (
    <div style={{ height:'100%', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:72, height:72, borderRadius:22, background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:16, boxShadow:'0 8px 24px rgba(22,163,74,.3)' }}>🏆</div>
      <h1 style={{ fontWeight:900, fontSize:24, color:'#111827' }}>Duatlón Track</h1>
      <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#16a34a', borderRadius:'50%', animation:'spin 1s linear infinite', marginTop:24 }}/>
    </div>
  )

  // Auth screen
  if (!user) return <AuthPage onSignIn={signIn} onSignUp={signUp} />

  // Open athlete profile
  const openAthlete = async (userId: string) => {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setViewedProfile(data)
    setSub({ modal:'athlete', userId })
  }

  const closeSub = () => { setSub(null); setViewedProfile(null) }

  const handleSignOut = async () => { await signOut(); setSub(null) }

  const handleRecordDone = () => {
    setSub(null)
    setScreen('feed')
  }

  // Sub screens
  if (sub?.modal === 'notifs')   return <NotificationsPage onBack={closeSub} myProfile={profile} />
  if (sub?.modal === 'messages') return <MessagesPage      onBack={closeSub} myProfile={profile} />
  if (sub?.modal === 'settings') return <SettingsPage      onBack={closeSub} myProfile={profile} onSignOut={handleSignOut} />
  if (sub?.modal === 'athlete')  return (
    <ProfilePage
      myProfile={profile}
      viewProfile={viewedProfile}
      isMe={false}
      onBack={closeSub}
    />
  )

  return (
    <div style={{ height:'100%', overflow:'hidden', position:'relative', background:'#fff' }}>

      {/* Main screens */}
      <div style={{ height:'100%', overflow:'hidden' }}>
        {screen === 'feed' && (
          <FeedPage
            myProfile={profile}
            onProfile={openAthlete}
            onNotifications={() => setSub({modal:'notifs'})}
            onMessages={() => setSub({modal:'messages'})}
          />
        )}
        {screen === 'map' && <MapPage />}
        {screen === 'record' && (
          <RecordPage
            myProfile={profile}
            onBack={() => setScreen('feed')}
            onDone={handleRecordDone}
          />
        )}
        {screen === 'explore' && (
          <ExplorePage
            myProfile={profile}
            onProfile={openAthlete}
          />
        )}
        {screen === 'profile' && (
          <ProfilePage
            myProfile={profile}
            isMe={true}
            onSettings={() => setSub({modal:'settings'})}
            onUpdateProfile={updateProfile}
          />
        )}
      </div>

      {/* Tab bar - hide on record */}
      {screen !== 'record' && (
        <TabBar active={screen} onChange={setScreen} />
      )}
    </div>
  )
}
