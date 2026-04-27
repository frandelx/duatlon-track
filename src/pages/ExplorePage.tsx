import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SPORT } from '@/constants/sports'
import type { Profile } from '@/types'

interface Props { myProfile: Profile|null; onProfile: (id:string) => void }

const SEGMENTS = [
  { name:'Subida al Tibidabo',    sport:'cycling', dist:'5.2 km', elev:'+380m', tries:142, best:'32:14', mine:'35:02', rank:8  },
  { name:'Trail Vallvidrera',     sport:'running', dist:'3.8 km', elev:'+210m', tries:89,  best:'18:42', mine:'21:15', rank:12 },
  { name:'Puerto de Vallcartes',  sport:'cycling', dist:'8.1 km', elev:'+620m', tries:67,  best:'48:55', mine:null,    rank:null },
  { name:'Carretera les Aigues',  sport:'running', dist:'6.4 km', elev:'+120m', tries:234, best:'22:08', mine:'24:30', rank:3  },
  { name:'Duatlón Sprint Circuit',sport:'duathlon',dist:'30 km',  elev:'+380m', tries:28,  best:'1:34',  mine:'1:42',  rank:5  },
]

export const ExplorePage: React.FC<Props> = ({ myProfile, onProfile }) => {
  const [tab, setTab]           = useState<'athletes'|'segments'>('athletes')
  const [query, setQuery]       = useState('')
  const [athletes, setAthletes] = useState<Profile[]>([])
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(false)

  useEffect(() => { loadAthletes() }, [])
  useEffect(() => { if (myProfile) loadFollowing() }, [myProfile])

  async function loadAthletes() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').neq('id', myProfile?.id ?? '').limit(20)
    setAthletes(data ?? [])
    setLoading(false)
  }

  async function loadFollowing() {
    if (!myProfile) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', myProfile.id)
    setFollowed(new Set(data?.map((f:any) => f.following_id) ?? []))
  }

  async function searchAthletes(q: string) {
    if (!q.trim()) { loadAthletes(); return }
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(10)
    setAthletes(data ?? [])
  }

  async function toggleFollow(athleteId: string) {
    if (!myProfile) return
    if (followed.has(athleteId)) {
      await supabase.from('follows').delete().eq('follower_id', myProfile.id).eq('following_id', athleteId)
      setFollowed(p => { const n=new Set(p); n.delete(athleteId); return n })
    } else {
      await supabase.from('follows').insert({ follower_id: myProfile.id, following_id: athleteId })
      setFollowed(p => new Set([...p, athleteId]))
    }
  }

  const filtered = athletes.filter(a => !query || a.username?.toLowerCase().includes(query.toLowerCase()) || a.name?.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      {/* Header */}
      <div style={{ padding:'calc(var(--safe-top)+14px) 16px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff', position:'sticky', top:0, zIndex:10 }}>
        <h2 style={{ fontWeight:800, fontSize:22, color:'#111827', marginBottom:12 }}>Explorar</h2>
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f7f7fa', border:'1px solid #e5e7eb', borderRadius:12, padding:'10px 14px', marginBottom:12 }}>
          <span style={{ fontSize:18 }}>🔍</span>
          <input value={query} onChange={e => { setQuery(e.target.value); searchAthletes(e.target.value) }}
            placeholder="Buscar atletas..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:15, color:'#111827' }}/>
          {query && <button onClick={() => { setQuery(''); loadAthletes() }} style={{ color:'#9ca3af', fontSize:18 }}>✕</button>}
        </div>
        <div style={{ display:'flex', background:'#f0f0f0', borderRadius:10, padding:3 }}>
          {(['athletes','segments'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex:1, padding:'8px 0', borderRadius:8, fontWeight:700, fontSize:14, transition:'all .2s',
                background:tab===t?'#fff':'transparent', color:tab===t?'#111827':'#9ca3af',
                boxShadow:tab===t?'0 1px 4px rgba(0,0,0,.1)':'none' }}>
              {t==='athletes'?'👥 Atletas':'🏁 Segmentos'}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex:1, background:'#f7f7fa', paddingBottom:85 }}>
        {tab === 'athletes' && (
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            {!query && <p style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Atletas registrados</p>}
            {loading && <p style={{ textAlign:'center', color:'#9ca3af', padding:20 }}>Cargando...</p>}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 16px' }}>
                <p style={{ fontSize:15, color:'#9ca3af' }}>No hay atletas aún</p>
                <p style={{ fontSize:13, color:'#d1d5db', marginTop:4 }}>¡Invita a tus amigos a unirse!</p>
              </div>
            )}
            {filtered.map(u => {
              const sp = SPORT[u.sport as keyof typeof SPORT] ?? SPORT.running
              const isFollowing = followed.has(u.id)
              return (
                <div key={u.id} style={{ background:'#fff', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                  <button onClick={() => onProfile(u.id)}
                    style={{ width:52, height:52, borderRadius:'50%', background:sp.bg, border:`2px solid ${sp.border}`, fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:700, color:sp.color }}>
                    {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </button>
                  <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => onProfile(u.id)}>
                    <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>{u.name}</p>
                    <p style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>@{u.username}{u.location ? ` · 📍${u.location}` : ''}</p>
                    <div style={{ display:'flex', gap:10, marginTop:4 }}>
                      <span style={{ fontSize:12, color:'#6b7280' }}><strong style={{ color:'#111827' }}>{u.followers_count}</strong> seg.</span>
                      <span style={{ fontSize:12, padding:'2px 8px', borderRadius:20, background:sp.bg, color:sp.color, fontWeight:600 }}>{sp.emoji} {sp.label}</span>
                    </div>
                  </div>
                  {myProfile && u.id !== myProfile.id && (
                    <button onClick={() => toggleFollow(u.id)}
                      style={{ padding:'8px 14px', borderRadius:20, fontWeight:700, fontSize:13, flexShrink:0,
                        background:isFollowing?'#f0f0f0':'#16a34a', color:isFollowing?'#6b7280':'#fff',
                        border:isFollowing?'1px solid #e5e7eb':'none' }}>
                      {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'segments' && (
          <div style={{ padding:16 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>Populares cerca de ti</p>
            {SEGMENTS.map((s,i) => {
              const c = SPORT[s.sport as keyof typeof SPORT] ?? SPORT.running
              return (
                <div key={i} style={{ background:'#fff', borderRadius:16, padding:'14px 16px', marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{c.emoji}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>{s.name}</p>
                      <p style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{s.dist} · {s.elev} · {s.tries} intentos</p>
                    </div>
                    <button style={{ padding:'6px 12px', borderRadius:10, background:c.bg, color:c.color, fontWeight:700, fontSize:12, border:`1px solid ${c.border}` }}>⭐</button>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ flex:1, background:'#f7f7fa', borderRadius:10, padding:'8px', textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>Mejor</div>
                      <div style={{ fontWeight:800, fontSize:15, color:'#111827', marginTop:2 }}>{s.best}</div>
                    </div>
                    {s.mine && (
                      <div style={{ flex:1, background:c.bg, borderRadius:10, padding:'8px', textAlign:'center' }}>
                        <div style={{ fontSize:11, color:c.color, fontWeight:500 }}>Mi mejor</div>
                        <div style={{ fontWeight:800, fontSize:15, color:c.color, marginTop:2 }}>{s.mine}</div>
                      </div>
                    )}
                    {s.rank && (
                      <div style={{ flex:1, background:'#fffbeb', borderRadius:10, padding:'8px', textAlign:'center' }}>
                        <div style={{ fontSize:11, color:'#f59e0b', fontWeight:500 }}>Posición</div>
                        <div style={{ fontWeight:800, fontSize:15, color:'#f59e0b', marginTop:2 }}>#{s.rank}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
