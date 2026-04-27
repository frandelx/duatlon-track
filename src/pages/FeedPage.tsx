import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { SPORT, fmtTime, fmtDist, timeAgo } from '@/constants/sports'
import type { Activity, Profile, Comment } from '@/types'

interface Props {
  myProfile: Profile | null
  onProfile: (id: string) => void
  onNotifications: () => void
  onMessages: () => void
}

const KUDOS_E = ['👏','🔥','💪','⚡','🎯','✨']

// Demo activities shown when no real data yet
const DEMO: Activity[] = [
  { id:'d1', user_id:'demo1', type:'cycling', title:'Ruta costera — Costa Brava', distance_m:92400, duration_s:11520, elevation_m:1240, avg_speed:28.9, avg_hr:148, kudos_count:12, comments_count:3, has_kudos:false, created_at: new Date(Date.now()-2*3600000).toISOString(),
    profile:{ id:'demo1', username:'marc_bike', name:'Marc Bosch', sport:'cycling', followers_count:324, following_count:120, activities_count:89 } },
  { id:'d2', user_id:'demo2', type:'running', title:'Trail Collserola 21k', distance_m:21000, duration_s:9600, elevation_m:1200, avg_pace:457, avg_hr:158, kudos_count:8, comments_count:2, has_kudos:false, created_at: new Date(Date.now()-5*3600000).toISOString(),
    profile:{ id:'demo2', username:'pau_trail', name:'Pau Ribas', sport:'running', followers_count:210, following_count:98, activities_count:145 } },
  { id:'d3', user_id:'demo3', type:'duathlon', title:'Duatlón Sprint Entrenamiento', distance_m:30000, duration_s:5820, elevation_m:380, avg_hr:162, kudos_count:5, comments_count:1, has_kudos:false, created_at: new Date(Date.now()-26*3600000).toISOString(),
    profile:{ id:'demo3', username:'marta_dua', name:'Marta Vidal', sport:'duathlon', followers_count:156, following_count:72, activities_count:62 } },
]

export const FeedPage: React.FC<Props> = ({ myProfile, onProfile, onNotifications, onMessages }) => {
  const [acts, setActs]           = useState<Activity[]>(DEMO)
  const [openCom, setOpenCom]     = useState<string|null>(null)
  const [comments, setComments]   = useState<Record<string,Comment[]>>({})
  const [comText, setComText]     = useState('')
  const [openMenu, setOpenMenu]   = useState<string|null>(null)
  const [loadingCom, setLoadingCom] = useState(false)

  useEffect(() => { loadFeed() }, [myProfile])

  async function loadFeed() {
    if (!myProfile) return
    // Get following IDs
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', myProfile.id)
    const ids = [...(follows?.map((f:any) => f.following_id) ?? []), myProfile.id]
    const { data } = await supabase
      .from('activities')
      .select('*, profile:profiles(*)')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data && data.length > 0) {
      // Check kudos
      const { data: kudos } = await supabase.from('kudos').select('activity_id').eq('user_id', myProfile.id)
      const kudosIds = new Set(kudos?.map((k:any) => k.activity_id) ?? [])
      setActs(data.map((a:any) => ({ ...a, has_kudos: kudosIds.has(a.id) })))
    }
  }

  async function loadComments(actId: string) {
    setLoadingCom(true)
    const { data } = await supabase.from('comments').select('*, profile:profiles(*)').eq('activity_id', actId).order('created_at')
    setComments(p => ({ ...p, [actId]: data ?? [] }))
    setLoadingCom(false)
  }

  const toggleComments = async (actId: string) => {
    if (openCom === actId) { setOpenCom(null); return }
    setOpenCom(actId)
    if (!comments[actId]) await loadComments(actId)
  }

  async function sendComment(actId: string) {
    if (!comText.trim() || !myProfile) return
    const newCom = { activity_id: actId, user_id: myProfile.id, body: comText.trim() }
    const { data } = await supabase.from('comments').insert(newCom).select('*, profile:profiles(*)').single()
    if (data) {
      setComments(p => ({ ...p, [actId]: [...(p[actId]??[]), data] }))
      setActs(p => p.map(a => a.id===actId ? {...a, comments_count: a.comments_count+1} : a))
    }
    setComText('')
  }

  const toggleKudos = async (act: Activity, e: React.MouseEvent) => {
    if (!myProfile) return
    if (!act.has_kudos) {
      for (let i=0; i<6; i++) {
        const p = document.createElement('div')
        const ang = (i/6)*2*Math.PI, d = 50+Math.random()*25
        p.textContent = KUDOS_E[i]
        p.style.cssText = `position:fixed;font-size:20px;pointer-events:none;z-index:9999;left:${e.clientX}px;top:${e.clientY}px;transform:translate(${Math.cos(ang)*d}px,${Math.sin(ang)*d-20}px);animation:float .9s ease forwards;animation-delay:${i*.05}s`
        document.body.appendChild(p); setTimeout(() => p.remove(), 1000)
      }
      await supabase.from('kudos').insert({ activity_id: act.id, user_id: myProfile.id })
    } else {
      await supabase.from('kudos').delete().eq('activity_id', act.id).eq('user_id', myProfile.id)
    }
    setActs(p => p.map(a => a.id!==act.id ? a : { ...a, has_kudos: !a.has_kudos, kudos_count: a.kudos_count + (a.has_kudos?-1:1) }))
  }

  const unreadNotifs = 3

  return (
    <div className="scroll" style={{ height:'100%', background:'#f7f7fa', paddingBottom:85 }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'calc(var(--safe-top)+14px) 16px 12px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15 }}>D</div>
          <span style={{ fontWeight:900, fontSize:18, color:'#16a34a' }}>Duatlón Track</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onNotifications} style={{ position:'relative', width:38, height:38, borderRadius:'50%', background:'#f7f7fa', border:'1px solid #e5e7eb', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>
            🔔
            {unreadNotifs > 0 && <span style={{ position:'absolute', top:0, right:0, width:16, height:16, background:'#ef4444', borderRadius:'50%', border:'2px solid #fff', fontSize:9, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{unreadNotifs}</span>}
          </button>
          <button onClick={onMessages} style={{ position:'relative', width:38, height:38, borderRadius:'50%', background:'#f7f7fa', border:'1px solid #e5e7eb', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✉️
            <span style={{ position:'absolute', top:0, right:0, width:16, height:16, background:'#2563eb', borderRadius:'50%', border:'2px solid #fff', fontSize:9, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>2</span>
          </button>
        </div>
      </div>

      {/* No following message */}
      {myProfile && acts === DEMO && (
        <div style={{ margin:16, padding:'16px', background:'#f0fdf4', borderRadius:16, border:'1px solid #bbf7d0', textAlign:'center' }}>
          <p style={{ fontSize:14, color:'#16a34a', fontWeight:600 }}>👋 Bienvenido a Duatlón Track</p>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>Sigue a otros atletas para ver sus actividades aquí. Mientras, mira estas de ejemplo.</p>
        </div>
      )}

      {/* Posts */}
      {acts.map(act => {
        const sp = SPORT[act.type]
        const coms = comments[act.id] ?? []
        return (
          <div key={act.id} style={{ background:'#fff', marginBottom:8, borderBottom:'1px solid #e5e7eb' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px' }}>
              <button onClick={() => onProfile(act.user_id)}
                style={{ width:46, height:46, borderRadius:'50%', background:sp.bg, border:`2px solid ${sp.border}`, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {act.profile?.name?.charAt(0)?.toUpperCase() ?? sp.emoji}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <button onClick={() => onProfile(act.user_id)} style={{ fontWeight:700, fontSize:15, color:'#111827', display:'block', textAlign:'left' }}>
                  {act.profile?.name ?? 'Atleta'}
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ fontSize:12, padding:'2px 8px', borderRadius:20, background:sp.bg, color:sp.color, fontWeight:600 }}>{sp.emoji} {sp.label}</span>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{timeAgo(act.created_at)}</span>
                </div>
              </div>
              <div style={{ position:'relative' }}>
                <button onClick={() => setOpenMenu(openMenu===act.id ? null : act.id)}
                  style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#9ca3af' }}>•••</button>
                {openMenu === act.id && (
                  <div style={{ position:'absolute', right:0, top:36, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,.12)', zIndex:100, minWidth:170, overflow:'hidden' }}>
                    {['✏️ Editar título','🔒 Cambiar privacidad','🗑️ Eliminar'].map((opt,i) => (
                      <button key={i} onClick={() => setOpenMenu(null)}
                        style={{ display:'block', width:'100%', padding:'12px 16px', textAlign:'left', fontSize:14, fontWeight:500, color:opt.includes('Eliminar')?'#ef4444':'#111827', borderBottom:i<2?'1px solid #f0f0f0':'none' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div style={{ padding:'0 16px 10px' }}>
              <p style={{ fontWeight:700, fontSize:16, color:'#111827' }}>{act.title}</p>
            </div>

            {/* Map preview */}
            <div style={{ width:'100%', height:170, background:'#e8e4e0', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)', backgroundSize:'24px 24px' }}/>
              <svg viewBox="0 0 375 170" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                <defs>
                  <linearGradient id={`g${act.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={sp.color}/>
                    <stop offset="100%" stopColor={sp.color} stopOpacity=".5"/>
                  </linearGradient>
                </defs>
                {act.gps_points && act.gps_points.length > 1 ? (
                  <polyline points={act.gps_points.map(([lat,lng]) => `${lng},${lat}`).join(' ')} fill="none" stroke={`url(#g${act.id})`} strokeWidth="4" strokeLinecap="round"/>
                ) : (
                  <path d={act.type==='duathlon'
                    ? "M30,140 Q90,100 150,80 Q200,65 230,75 Q265,85 290,55 Q320,30 345,45"
                    : act.type==='cycling'
                    ? "M30,140 Q90,105 150,75 Q210,45 270,65 Q310,80 345,58"
                    : "M30,140 Q80,108 130,82 Q175,58 215,72 Q265,88 320,48 Q338,38 345,52"}
                    fill="none" stroke={`url(#g${act.id})`} strokeWidth="4" strokeLinecap="round"/>
                )}
                <circle cx="30" cy="140" r="7" fill={sp.color}/>
              </svg>
              <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(255,255,255,.92)', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:600, color:'#374151' }}>
                Ver ruta
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', borderBottom:'1px solid #f0f0f0' }}>
              {[
                { v: fmtDist(act.distance_m), l:'Distancia' },
                { v: fmtTime(act.duration_s), l:'Tiempo' },
                { v: act.avg_speed ? `${act.avg_speed.toFixed(1)} km/h` : act.avg_pace ? `${Math.floor(act.avg_pace/60)}:${String(act.avg_pace%60).padStart(2,'0')} /km` : `+${act.elevation_m}m`, l: act.avg_speed?'Velocidad':act.avg_pace?'Ritmo':'D+' },
                { v: act.avg_hr ? `${act.avg_hr} bpm` : `+${Math.round(act.elevation_m)}m`, l: act.avg_hr?'FC media':'D+' },
              ].map((s,i) => (
                <div key={i} style={{ flex:1, padding:'12px 0', textAlign:'center', borderRight:i<3?'1px solid #f0f0f0':'none' }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#111827' }}>{s.v}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Kudos count */}
            {(act.kudos_count > 0 || act.comments_count > 0) && (
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 16px', borderBottom:'1px solid #f0f0f0' }}>
                {act.kudos_count > 0 && <span style={{ fontSize:13, color:'#6b7280' }}>👏 {act.kudos_count} felicitaciones</span>}
                {act.comments_count > 0 && (
                  <button onClick={() => toggleComments(act.id)} style={{ fontSize:13, color:'#6b7280', marginLeft:'auto' }}>
                    {act.comments_count} comentarios
                  </button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', padding:'4px 8px' }}>
              <button onClick={e => toggleKudos(act, e)}
                style={{ flex:1, padding:'10px 4px', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontWeight:600, fontSize:13, borderRadius:8,
                  color: act.has_kudos ? sp.color : '#6b7280',
                  background: act.has_kudos ? sp.bg : 'transparent' }}>
                <span style={{ fontSize:18 }}>👏</span>
                {act.has_kudos ? 'Felicitado' : 'Felicitar'}
              </button>
              <button onClick={() => toggleComments(act.id)}
                style={{ flex:1, padding:'10px 4px', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontWeight:600, fontSize:13, color:'#6b7280', borderRadius:8 }}>
                <span style={{ fontSize:18 }}>💬</span> Comentar
              </button>
              <button onClick={() => { if (navigator.share) navigator.share({ title: act.title, url: window.location.href }) }}
                style={{ flex:1, padding:'10px 4px', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontWeight:600, fontSize:13, color:'#6b7280', borderRadius:8 }}>
                <span style={{ fontSize:18 }}>↗️</span> Compartir
              </button>
            </div>

            {/* Comments */}
            {openCom === act.id && (
              <div style={{ borderTop:'1px solid #f0f0f0', padding:'12px 16px', background:'#fafafa' }}>
                {loadingCom && <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', padding:'8px 0' }}>Cargando...</p>}
                {coms.map(c => (
                  <div key={c.id} style={{ display:'flex', gap:10, marginBottom:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                      {c.profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ flex:1, background:'#fff', borderRadius:12, padding:'8px 12px', border:'1px solid #f0f0f0' }}>
                      <p style={{ fontWeight:700, fontSize:13, color:'#111827' }}>{c.profile?.name ?? 'Atleta'}</p>
                      <p style={{ fontSize:13, color:'#374151', marginTop:2 }}>{c.body}</p>
                      <p style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{timeAgo(c.created_at)}</p>
                    </div>
                  </div>
                ))}
                {coms.length === 0 && !loadingCom && (
                  <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', padding:'4px 0 8px' }}>Sé el primero en comentar</p>
                )}
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                    {myProfile?.name?.charAt(0)?.toUpperCase() ?? 'T'}
                  </div>
                  <div style={{ flex:1, display:'flex', gap:8 }}>
                    <input value={comText} onChange={e => setComText(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && sendComment(act.id)}
                      placeholder="Añade un comentario..."
                      style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:20, padding:'8px 14px', fontSize:14, outline:'none', background:'#fff' }}/>
                    <button onClick={() => sendComment(act.id)}
                      style={{ width:36, height:36, borderRadius:'50%', background:'#16a34a', color:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>↑</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
