import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SPORT, fmtDist, fmtTime, timeAgo } from '@/constants/sports'
import type { Profile, Activity } from '@/types'

interface Props {
  myProfile:      Profile | null
  viewProfile?:   Profile | null
  isMe?:          boolean
  onBack?:        () => void
  onSettings?:    () => void
  onUpdateProfile?: (updates: Partial<Profile>) => void
}

const HC = ['#f0f0f0','#bbf7d0','#4ade80','#16a34a','#15803d']
const hm = Array.from({length:52*7}, () => { const r=Math.random(); return r<.45?0:r<.65?1:r<.8?2:r<.92?3:4 })

export const ProfilePage: React.FC<Props> = ({ myProfile, viewProfile, isMe=true, onBack, onSettings, onUpdateProfile }) => {
  const profile = viewProfile ?? myProfile
  const [tab, setTab]           = useState<'acts'|'stats'>('acts')
  const [activities, setActs]   = useState<Activity[]>([])
  const [following, setFollowing] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [editName, setEditName] = useState(profile?.name ?? '')
  const [editBio, setEditBio]   = useState(profile?.bio ?? '')
  const [editLocation, setEditLoc] = useState(profile?.location ?? '')
  const [saving, setSaving]     = useState(false)

  const cfg = SPORT[(profile?.sport as keyof typeof SPORT) ?? 'duathlon']

  useEffect(() => {
    if (profile) {
      setEditName(profile.name ?? '')
      setEditBio(profile.bio ?? '')
      setEditLoc(profile.location ?? '')
      loadActivities()
      if (!isMe && myProfile) checkFollowing()
    }
  }, [profile])

  async function loadActivities() {
    if (!profile) return
    const { data } = await supabase.from('activities').select('*').eq('user_id', profile.id).order('created_at', { ascending:false }).limit(10)
    setActs(data ?? [])
  }

  async function checkFollowing() {
    if (!myProfile || !profile) return
    const { data } = await supabase.from('follows').select('*').eq('follower_id', myProfile.id).eq('following_id', profile.id).single()
    setFollowing(!!data)
  }

  async function toggleFollow() {
    if (!myProfile || !profile) return
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', myProfile.id).eq('following_id', profile.id)
    } else {
      await supabase.from('follows').insert({ follower_id: myProfile.id, following_id: profile.id })
    }
    setFollowing(p => !p)
  }

  const saveEdit = async () => {
    setSaving(true)
    const updates = { name: editName, bio: editBio, location: editLocation }
    await onUpdateProfile?.(updates)
    setSaving(false)
    setEditing(false)
  }

  const changePhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file || !myProfile) return
      const ext  = file.name.split('.').pop()
      const path = `${myProfile.id}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert:true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        await onUpdateProfile?.({ avatar_url: data.publicUrl })
        alert('Foto actualizada ✓')
      }
    }
    input.click()
  }

  if (!profile) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#9ca3af' }}>Cargando perfil...</p>
    </div>
  )

  return (
    <div className="scroll" style={{ height:'100%', background:'#f7f7fa', paddingBottom:isMe?90:40 }}>
      {/* Back header */}
      {onBack && (
        <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(255,255,255,.97)', backdropFilter:'blur(8px)', borderBottom:'1px solid #e5e7eb', padding:'calc(var(--safe-top)+8px) 16px 8px', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ fontSize:26, color:'#16a34a', fontWeight:700, lineHeight:1 }}>‹</button>
          <span style={{ fontWeight:700, fontSize:17, color:'#111827' }}>{profile.name}</span>
        </div>
      )}

      {/* Cover */}
      <div style={{ background:`linear-gradient(135deg,${cfg.color}cc,${cfg.dark})`, height: onBack ? 90 : 'calc(var(--safe-top) + 90px)', position:'relative' }}>
        {isMe && !onBack && (
          <div style={{ position:'absolute', top:'calc(var(--safe-top)+12px)', right:16 }}>
            <button onClick={onSettings}
              style={{ background:'rgba(255,255,255,.2)', borderRadius:20, padding:'7px 16px', color:'#fff', fontWeight:600, fontSize:13, border:'1px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', gap:6 }}>
              ⚙️ Ajustes
            </button>
          </div>
        )}
      </div>

      {/* Profile card */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 16px 16px', position:'relative' }}>
        {/* Avatar */}
        <div style={{ position:'relative', width:82, height:82, marginTop:-41 }}>
          <div style={{ width:82, height:82, borderRadius:'50%', background:cfg.bg, border:'4px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 16px rgba(0,0,0,.12)', overflow:'hidden' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <span style={{ fontSize:30, fontWeight:700, color:cfg.color }}>{profile.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
            }
          </div>
          {isMe && (
            <button onClick={changePhoto}
              style={{ position:'absolute', bottom:-2, right:-2, width:28, height:28, borderRadius:'50%', background:'#16a34a', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, cursor:'pointer' }}>
              📷
            </button>
          )}
        </div>

        {/* Edit mode */}
        {editing ? (
          <div style={{ marginTop:10 }}>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Nombre" style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'10px 12px', fontSize:16, outline:'none', marginBottom:8, color:'#111827' }}/>
            <input value={editLocation} onChange={e => setEditLoc(e.target.value)}
              placeholder="Ciudad" style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'10px 12px', fontSize:15, outline:'none', marginBottom:8, color:'#111827' }}/>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..." rows={3}
              style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'10px 12px', fontSize:15, outline:'none', resize:'none', color:'#111827', marginBottom:10 }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setEditing(false)}
                style={{ flex:1, padding:'10px', borderRadius:10, background:'#f7f7fa', border:'1px solid #e5e7eb', fontWeight:600, fontSize:14, color:'#6b7280' }}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ flex:2, padding:'10px', borderRadius:10, background:'#16a34a', color:'#fff', fontWeight:700, fontSize:14, opacity:saving?.7:1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop:10 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ fontWeight:900, fontSize:22, color:'#111827' }}>{profile.name}</h2>
                <p style={{ fontSize:14, color:'#9ca3af', marginTop:2 }}>@{profile.username}{profile.location ? ` · 📍${profile.location}` : ''}</p>
              </div>
              {isMe && (
                <button onClick={() => setEditing(true)}
                  style={{ padding:'7px 14px', borderRadius:20, background:'#f7f7fa', border:'1px solid #e5e7eb', fontSize:13, fontWeight:600, color:'#374151', flexShrink:0 }}>
                  ✏️ Editar
                </button>
              )}
            </div>
            {profile.bio && <p style={{ fontSize:14, color:'#374151', marginTop:8, lineHeight:1.5 }}>{profile.bio}</p>}
            <span style={{ display:'inline-block', marginTop:10, fontSize:13, padding:'4px 12px', borderRadius:20, background:cfg.bg, color:cfg.color, fontWeight:600 }}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
        )}

        {/* Follow / Stats */}
        {!isMe ? (
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={toggleFollow}
              style={{ flex:1, padding:11, borderRadius:12, fontWeight:700, fontSize:15, background:following?'#f7f7fa':'#16a34a', color:following?'#6b7280':'#fff', border:following?'1.5px solid #e5e7eb':'none' }}>
              {following ? '✓ Siguiendo' : '+ Seguir'}
            </button>
            <button style={{ width:44, height:44, borderRadius:12, background:'#f7f7fa', border:'1px solid #e5e7eb', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>💬</button>
          </div>
        ) : (
          <div style={{ display:'flex', marginTop:14, background:'#f7f7fa', borderRadius:14, overflow:'hidden', border:'1px solid #e5e7eb' }}>
            {[{v:profile.followers_count,l:'Seguidores'},{v:profile.following_count,l:'Siguiendo'},{v:profile.activities_count,l:'Actividades'}].map((s,i) => (
              <div key={i} style={{ flex:1, padding:'12px 0', textAlign:'center', borderRight:i<2?'1px solid #e5e7eb':'none', cursor:'pointer' }}>
                <div style={{ fontWeight:800, fontSize:20, color:'#111827' }}>{s.v}</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div style={{ background:'#fff', margin:'8px 0', padding:'16px', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }}>
        <p style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:12 }}>Actividad 2025</p>
        <div style={{ display:'flex', gap:2, overflowX:'auto' }} className="scroll">
          {Array.from({length:52}, (_,w) => (
            <div key={w} style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {Array.from({length:7}, (_,d) => (
                <div key={d} style={{ width:10, height:10, borderRadius:2, background:HC[hm[w*7+d]] }}/>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PRs */}
      <div style={{ background:'#fff', margin:'0 0 8px', padding:'16px', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }}>
        <p style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:12 }}>Records personales</p>
        <div style={{ display:'flex', gap:10 }}>
          {[
            { e:'🏃', v:'3:28', u:'/km', l:'Ritmo PR',  c:'#16a34a' },
            { e:'🚴', v:'42.8', u:'km/h',l:'Vel. máx',  c:'#2563eb' },
            { e:'🏆', v:'2:04', u:'h:m', l:'Duatlón PR',c:'#9333ea' },
          ].map((r,i) => (
            <div key={i} style={{ flex:1, background:'#f7f7fa', borderRadius:14, padding:'12px', textAlign:'center', border:'1px solid #e8e8e8' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{r.e}</div>
              <div style={{ fontWeight:800, fontSize:16, color:r.c }}>{r.v}<span style={{ fontSize:11, color:'#9ca3af', marginLeft:2 }}>{r.u}</span></div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:3, fontWeight:500 }}>{r.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex' }}>
        {(['acts','stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:'13px 0', fontWeight:700, fontSize:14, color:tab===t?'#16a34a':'#9ca3af', borderBottom:tab===t?'2px solid #16a34a':'2px solid transparent' }}>
            {t==='acts' ? 'Actividades' : 'Estadísticas'}
          </button>
        ))}
      </div>

      {tab === 'acts' && (
        <div style={{ paddingBottom:8 }}>
          {activities.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 16px' }}>
              <p style={{ fontSize:15, color:'#9ca3af' }}>Sin actividades aún</p>
              <p style={{ fontSize:13, color:'#d1d5db', marginTop:4 }}>Graba tu primera actividad 🏃</p>
            </div>
          )}
          {activities.map(a => {
            const c = SPORT[a.type as keyof typeof SPORT] ?? SPORT.running
            return (
              <div key={a.id} style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:46, height:46, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{c.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>{a.title}</p>
                  <p style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{timeAgo(a.created_at)}</p>
                  <div style={{ display:'flex', gap:12, marginTop:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{fmtDist(a.distance_m)}</span>
                    <span style={{ fontSize:13, color:'#9ca3af' }}>{fmtTime(a.duration_s)}</span>
                    <span style={{ fontSize:13, color:'#9ca3af' }}>+{a.elevation_m}m</span>
                  </div>
                </div>
                <span style={{ color:'#d1d5db', fontSize:22 }}>›</span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'stats' && (
        <div style={{ padding:16, paddingBottom:80 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { v:`${activities.reduce((s,a)=>s+a.distance_m,0)/1000|0} km`, l:'Total distancia', e:'📏' },
              { v:`${activities.reduce((s,a)=>s+(a.duration_s/3600),0).toFixed(0)}h`, l:'Tiempo total', e:'⏱' },
              { v:`${activities.reduce((s,a)=>s+a.elevation_m,0)|0}m`, l:'Desnivel +', e:'⛰️' },
              { v:String(profile.activities_count), l:'Actividades', e:'📊' },
              { v:String(profile.followers_count), l:'Seguidores', e:'👥' },
              { v:cfg.label, l:'Deporte', e:cfg.emoji },
            ].map((s,i) => (
              <div key={i} style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{s.e}</div>
                <div style={{ fontWeight:800, fontSize:20, color:'#111827' }}>{s.v}</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
