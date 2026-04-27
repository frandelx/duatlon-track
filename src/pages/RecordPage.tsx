import React, { useState, useEffect, useRef } from 'react'
import * as L from 'leaflet'
import { supabase } from '@/lib/supabase'
import { useGPS } from '@/hooks/useGPS'
import { SPORT, fmtTime, fmtDist } from '@/constants/sports'
import type { Sport, Profile } from '@/types'

interface Props { myProfile: Profile | null; onBack: () => void; onDone: () => void }
type Phase = 'select' | 'setup' | 'countdown' | 'recording' | 'paused' | 'done'

const SPORTS: Sport[] = ['running', 'cycling', 'duathlon']
const DUA_SEGS = ['RUN 1','T1','BIKE','T2','RUN 2']

export const RecordPage: React.FC<Props> = ({ myProfile, onBack, onDone }) => {
  const [phase, setPhase]     = useState<Phase>('select')
  const [sport, setSport]     = useState<Sport>('running')
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCount] = useState(3)
  const [segIdx, setSegIdx]   = useState(0)
  const [title, setTitle]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [transitions, setTransitions] = useState<{name:string;lat:number;lng:number}[]>([])

  const gps = useGPS()
  const timerRef   = useRef<any>()
  const mapRef     = useRef<L.Map|null>(null)
  const polyRef    = useRef<L.Polyline|null>(null)
  const markerRef  = useRef<L.Marker|null>(null)
  const mapContRef = useRef<HTMLDivElement>(null)
  const cfg = SPORT[sport]

  // Init map when recording starts
  useEffect(() => {
    if (phase !== 'recording' && phase !== 'paused') return
    if (!mapContRef.current || mapRef.current) return
    const map = L.map(mapContRef.current, { center:[41.39,2.17], zoom:15, zoomControl:false, attributionControl:false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map)
    polyRef.current  = L.polyline([], { color: cfg.color, weight:5, lineCap:'round' }).addTo(map)
    const icon = L.divIcon({ html:`<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.3)"></div>`, className:'', iconSize:[14,14], iconAnchor:[7,7] })
    markerRef.current = L.marker([41.39,2.17], { icon }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; polyRef.current = null; markerRef.current = null }
  }, [phase])

  // Update map as GPS points come in
  useEffect(() => {
    if (!gps.current || !mapRef.current) return
    const pos: L.LatLngExpression = [gps.current.lat, gps.current.lng]
    polyRef.current?.addLatLng(pos)
    markerRef.current?.setLatLng(pos)
    mapRef.current.panTo(pos)
    // Check transition proximity (50m)
    transitions.forEach(t => {
      const d = haversine(gps.current!.lat, gps.current!.lng, t.lat, t.lng)
      if (d < 50) { if (navigator.vibrate) navigator.vibrate([200,100,200]) }
    })
  }, [gps.current])

  function haversine(lat1:number,lng1:number,lat2:number,lng2:number) {
    const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  }

  const startCountdown = () => {
    setPhase('countdown'); setCount(3)
    let c=3
    const t = setInterval(()=>{ c--; setCount(c); if(c<=0){ clearInterval(t); startRecording() } },1000)
  }

  const startRecording = () => {
    setPhase('recording'); setElapsed(0); setSegIdx(0)
    gps.start()
    timerRef.current = setInterval(()=>setElapsed(p=>p+1),1000)
  }

  const pause = () => {
    setPhase('paused'); gps.stop()
    clearInterval(timerRef.current)
  }

  const resume = () => {
    setPhase('recording'); gps.start()
    timerRef.current = setInterval(()=>setElapsed(p=>p+1),1000)
  }

  const finish = async () => {
    gps.stop(); clearInterval(timerRef.current)
    setPhase('done')
  }

  const saveActivity = async () => {
    if (!myProfile) return
    setSaving(true)
    const actTitle = title.trim() || `${cfg.label} — ${new Date().toLocaleDateString('es-ES',{day:'numeric',month:'short'})}`
    const speed = elapsed>0 ? (gps.distanceM/elapsed)*3.6 : 0
    const pace  = speed>0 ? Math.round(3600/speed) : 0

    await supabase.from('activities').insert({
      user_id:      myProfile.id,
      type:         sport,
      title:        actTitle,
      distance_m:   Math.round(gps.distanceM),
      duration_s:   elapsed,
      elevation_m:  Math.round(gps.elevGain),
      avg_speed:    sport==='cycling' ? parseFloat(speed.toFixed(1)) : null,
      avg_pace:     sport==='running' ? pace : null,
      gps_points:   gps.points.map(p=>[p.lat,p.lng]),
      kudos_count:  0,
      comments_count: 0,
    })
    // Update activity count
    await supabase.from('profiles').update({ activities_count: myProfile.activities_count+1 }).eq('id', myProfile.id)
    setSaving(false)
    onDone()
  }

  const markTransition = (name: string) => {
    if (!gps.current) { alert('Espera a tener señal GPS'); return }
    setTransitions(p => { const f=p.filter(t=>t.name!==name); return [...f,{name,lat:gps.current!.lat,lng:gps.current!.lng}] })
  }

  const takePhoto = () => {
    const input = document.createElement('input')
    input.type='file'; input.accept='image/*'; input.capture='environment'
    input.click()
  }

  const speed = elapsed>0 ? (gps.distanceM/elapsed)*3.6 : 0
  const pace  = speed>0 ? Math.round(3600/speed) : 0

  // ── DONE ──────────────────────────────────────────────────────
  if (phase==='done') return (
    <div className="scroll" style={{height:'100%',background:'#f7f7fa',paddingBottom:40}}>
      <div style={{background:cfg.color,padding:'calc(var(--safe-top)+24px) 20px 32px',color:'#fff',textAlign:'center'}}>
        <p style={{fontSize:15,fontWeight:600,opacity:.8,marginBottom:8}}>✓ Actividad completada</p>
        <h2 style={{fontSize:30,fontWeight:900}}>{cfg.emoji} {cfg.label}</h2>
      </div>

      {/* Stats */}
      <div style={{margin:16,background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 2px 16px rgba(0,0,0,.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
          {[
            {v:fmtDist(gps.distanceM),l:'Distancia'},
            {v:fmtTime(elapsed),l:'Tiempo'},
            {v:sport==='cycling'?`${speed.toFixed(1)} km/h`:`${Math.floor(pace/60)}:${String(pace%60).padStart(2,'0')} /km`,l:sport==='cycling'?'Velocidad':'Ritmo'},
            {v:`+${Math.round(gps.elevGain)} m`,l:'Desnivel'},
          ].map((s,i)=>(
            <div key={i} style={{padding:'20px 16px',textAlign:'center',borderRight:i%2===0?'1px solid #f0f0f0':'none',borderBottom:i<2?'1px solid #f0f0f0':'none'}}>
              <div style={{fontWeight:900,fontSize:24,color:'#111827'}}>{s.v}</div>
              <div style={{fontSize:12,color:'#9ca3af',marginTop:4,fontWeight:500}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Title input */}
      <div style={{margin:'0 16px 16px'}}>
        <p style={{fontSize:13,fontWeight:600,color:'#6b7280',marginBottom:8}}>Título de la actividad</p>
        <input value={title} onChange={e=>setTitle(e.target.value)}
          placeholder={`${cfg.label} — ${new Date().toLocaleDateString('es-ES',{day:'numeric',month:'short'})}`}
          style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:12,padding:'12px 14px',fontSize:15,outline:'none',color:'#111827'}}/>
      </div>

      <div style={{padding:'0 16px',display:'flex',gap:10}}>
        <button onClick={onBack} style={{flex:1,padding:14,borderRadius:14,background:'#fff',border:'2px solid #e5e7eb',fontWeight:700,fontSize:15,color:'#6b7280'}}>
          Descartar
        </button>
        <button onClick={saveActivity} disabled={saving}
          style={{flex:2,padding:14,borderRadius:14,background:cfg.color,color:'#fff',fontWeight:700,fontSize:15,opacity:saving?.7:1}}>
          {saving ? 'Guardando...' : '💾 Guardar actividad'}
        </button>
      </div>
    </div>
  )

  // ── COUNTDOWN ────────────────────────────────────────────────
  if (phase==='countdown') return (
    <div style={{height:'100%',background:cfg.color,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'rgba(255,255,255,.8)',fontSize:18,fontWeight:600,marginBottom:24}}>Preparado…</p>
      <div style={{fontSize:120,fontWeight:900,color:'#fff',lineHeight:1}}>{countdown}</div>
      <p style={{color:'rgba(255,255,255,.7)',fontSize:16,marginTop:24}}>{cfg.emoji} {cfg.label} · GPS iniciando</p>
    </div>
  )

  // ── RECORDING / PAUSED ───────────────────────────────────────
  if (phase==='recording'||phase==='paused') return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#000'}}>
      {/* Map */}
      <div style={{flex:1,position:'relative'}}>
        <div ref={mapContRef} style={{width:'100%',height:'100%'}}/>

        {/* GPS error */}
        {gps.error && (
          <div style={{position:'absolute',top:60,left:12,right:12,zIndex:50,background:'#fef2f2',borderRadius:10,padding:'8px 12px',fontSize:13,color:'#ef4444',fontWeight:600}}>
            ⚠️ {gps.error}
          </div>
        )}

        {/* Duathlon bar */}
        {sport==='duathlon'&&(
          <div style={{position:'absolute',top:'calc(var(--safe-top)+8px)',left:12,right:12,display:'flex',borderRadius:10,overflow:'hidden',height:30,zIndex:20}}>
            {DUA_SEGS.map((s,i)=>(
              <div key={i} style={{flex:s.includes('T')?.4:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,
                background:i<segIdx?'rgba(22,163,74,.7)':i===segIdx?cfg.color:'rgba(0,0,0,.5)',
                color:i===segIdx?'#fff':i<segIdx?'rgba(255,255,255,.7)':'rgba(255,255,255,.4)'}}>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* GPS badge */}
        <div style={{position:'absolute',top:sport==='duathlon'?'calc(var(--safe-top)+48px)':'calc(var(--safe-top)+12px)',right:12,zIndex:50,background:'rgba(0,0,0,.6)',borderRadius:20,padding:'5px 10px',display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:gps.tracking?'#22c55e':'#ef4444',animation:gps.tracking?'ping 2s infinite':''}}/>
          <span style={{color:'#fff',fontSize:11,fontWeight:600}}>{gps.tracking?'GPS':'Sin GPS'}</span>
        </div>

        {/* Paused overlay */}
        {phase==='paused'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10}}>
            <div style={{background:'rgba(255,255,255,.1)',borderRadius:20,padding:'16px 32px',border:'1px solid rgba(255,255,255,.2)'}}>
              <p style={{color:'#fff',fontWeight:900,fontSize:24,letterSpacing:4}}>PAUSADO</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats panel */}
      <div style={{background:'#111',padding:'18px 20px 0'}}>
        <div style={{textAlign:'center',marginBottom:14}}>
          <div style={{fontWeight:900,fontSize:60,color:'#fff',lineHeight:1,fontVariantNumeric:'tabular-nums'}}>
            {(gps.distanceM/1000).toFixed(2)}
          </div>
          <div style={{fontSize:14,color:'#6b7280',marginTop:2}}>km</div>
        </div>
        <div style={{display:'flex',marginBottom:16}}>
          {[
            {v:fmtTime(elapsed),l:'Tiempo'},
            {v:sport==='cycling'?`${speed.toFixed(1)}`:`${Math.floor(pace/60)}:${String(pace%60).padStart(2,'0')}`,l:sport==='cycling'?'km/h':'/km'},
            {v:`+${Math.round(gps.elevGain)}m`,l:'D+'},
          ].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:'center',borderRight:i<2?'1px solid #222':'none'}}>
              <div style={{fontWeight:800,fontSize:22,color:'#fff',fontVariantNumeric:'tabular-nums'}}>{s.v}</div>
              <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{background:'#111',padding:'0 20px 20px',paddingBottom:'calc(env(safe-area-inset-bottom,0px)+20px)',display:'flex',alignItems:'center',justifyContent:'space-around'}}>
        <button onClick={takePhoto} style={{width:56,height:56,borderRadius:'50%',background:'#222',border:'1px solid #333',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center'}}>📸</button>
        {phase==='recording'
          ?<button onClick={pause} style={{width:72,height:72,borderRadius:'50%',background:cfg.color,fontSize:26,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 20px ${cfg.color}80`,color:'#fff'}}>⏸</button>
          :<button onClick={resume} style={{width:72,height:72,borderRadius:'50%',background:'#22c55e',fontSize:26,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(34,197,94,.5)',color:'#fff'}}>▶</button>
        }
        {sport==='duathlon'&&segIdx<4
          ?<button onClick={()=>setSegIdx(s=>s+1)} style={{width:56,height:56,borderRadius:'50%',background:'#1e3a8a',border:'2px solid #2563eb',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#60a5fa'}}>
            <span style={{fontSize:18}}>⚡</span>
            <span style={{fontSize:9,fontWeight:800,marginTop:1}}>T{segIdx===0?1:2}</span>
          </button>
          :<button onClick={finish} style={{width:56,height:56,borderRadius:'50%',background:'#1a0a0a',border:'1px solid #ef4444',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444'}}>⏹</button>
        }
      </div>
      {sport==='duathlon'&&segIdx<4&&(
        <button onClick={finish} style={{background:'#0a0a0a',borderTop:'1px solid #333',padding:'10px',color:'#ef4444',fontSize:13,fontWeight:600,width:'100%',paddingBottom:'calc(env(safe-area-inset-bottom,0px)+10px)'}}>
          ⏹ Finalizar actividad
        </button>
      )}
    </div>
  )

  // ── SETUP ────────────────────────────────────────────────────
  if (phase==='setup') return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#fff'}}>
      <div style={{padding:'calc(var(--safe-top)+14px) 16px 12px',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>setPhase('select')} style={{fontSize:26,color:'#16a34a',fontWeight:700,lineHeight:1}}>‹</button>
        <h2 style={{fontWeight:800,fontSize:20,color:'#111827'}}>Configurar {cfg.label}</h2>
      </div>
      <div className="scroll" style={{flex:1,padding:16}}>

        {/* Load GPX */}
        <div style={{background:'#f7f7fa',borderRadius:16,padding:16,marginBottom:16,border:'1px solid #e5e7eb'}}>
          <p style={{fontWeight:700,fontSize:15,color:'#111827',marginBottom:10}}>📂 Cargar ruta GPX</p>
          <label style={{display:'block',width:'100%',padding:'12px 16px',borderRadius:12,background:'#fff',border:'1.5px dashed #d1d5db',textAlign:'center',cursor:'pointer',fontSize:14,color:'#6b7280',fontWeight:500}}>
            Toca para seleccionar archivo GPX
            <input type="file" accept=".gpx,.tcx,.fit" style={{display:'none'}}
              onChange={e=>{
                const f=e.target.files?.[0]
                if(f) alert(`Ruta cargada: ${f.name}\n(La ruta se mostrará en el mapa durante la grabación)`)
              }}/>
          </label>
        </div>

        {/* Transitions (duathlon only) */}
        {sport==='duathlon'&&(
          <div style={{background:'#f7f7fa',borderRadius:16,padding:16,border:'1px solid #e5e7eb'}}>
            <p style={{fontWeight:700,fontSize:15,color:'#111827',marginBottom:4}}>⚡ Puntos de transición</p>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:12}}>Pulsa "Marcar" cuando estés en el punto T1 o T2. La app avisará con vibración al acercarte durante la carrera.</p>
            {['T1','T2'].map(t=>{
              const set = transitions.find(x=>x.name===t)
              return (
                <div key={t} style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:8,border:`1.5px solid ${set?cfg.color:'#e5e7eb'}`,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:set?cfg.bg:'#f0f0f0',border:`2px solid ${set?cfg.color:'#e5e7eb'}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,color:set?cfg.color:'#9ca3af',flexShrink:0}}>
                    {t}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:700,fontSize:14,color:'#111827'}}>{t==='T1'?'Fin carrera → Inicio bici':'Fin bici → Inicio carrera'}</p>
                    <p style={{fontSize:12,color:set?cfg.color:'#9ca3af',marginTop:2}}>{set?`✓ Marcado en (${set.lat.toFixed(4)}, ${set.lng.toFixed(4)})`:'Sin marcar'}</p>
                  </div>
                  <button onClick={()=>set?setTransitions(p=>p.filter(x=>x.name!==t)):markTransition(t)}
                    style={{padding:'8px 12px',borderRadius:10,background:set?'#fef2f2':cfg.bg,color:set?'#ef4444':cfg.color,fontWeight:700,fontSize:13,border:`1px solid ${set?'#fecaca':cfg.border}`,flexShrink:0}}>
                    {set?'Quitar':'+ Marcar'}
                  </button>
                </div>
              )
            })}
            <div style={{background:'#fffbeb',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#92400e',border:'1px solid #fde68a',marginTop:4}}>
              💡 Activa el GPS primero pulsando "Iniciar" — luego puedes marcar las transiciones durante el calentamiento.
            </div>
          </div>
        )}
      </div>
      <div style={{padding:16,paddingBottom:'calc(env(safe-area-inset-bottom,0px)+16px)',borderTop:'1px solid #e5e7eb'}}>
        <button onClick={startCountdown}
          style={{width:'100%',padding:16,borderRadius:16,background:cfg.color,color:'#fff',fontWeight:800,fontSize:17,boxShadow:`0 4px 20px ${cfg.color}50`}}>
          {cfg.emoji} Iniciar {cfg.label}
        </button>
      </div>
    </div>
  )

  // ── SPORT SELECT ──────────────────────────────────────────────
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#fff'}}>
      <div style={{padding:'calc(var(--safe-top)+14px) 16px 12px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid #e5e7eb'}}>
        <button onClick={onBack} style={{fontSize:26,color:'#6b7280',lineHeight:1}}>✕</button>
        <h2 style={{fontWeight:800,fontSize:20,color:'#111827'}}>Nueva actividad</h2>
      </div>
      <div className="scroll" style={{flex:1,padding:16,display:'flex',flexDirection:'column',gap:12}}>
        {SPORTS.map(s=>{
          const c=SPORT[s]; const sel=sport===s
          return (
            <button key={s} onClick={()=>setSport(s)}
              style={{padding:'18px 20px',borderRadius:18,border:`2px solid ${sel?c.color:c.border}`,background:sel?c.bg:'#fff',display:'flex',alignItems:'center',gap:16,textAlign:'left',transition:'all .2s',boxShadow:sel?`0 4px 20px ${c.color}25`:'none'}}>
              <div style={{width:60,height:60,borderRadius:16,background:c.bg,border:`2px solid ${c.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>{c.emoji}</div>
              <div style={{flex:1}}>
                <p style={{fontWeight:800,fontSize:18,color:sel?c.color:'#111827'}}>{c.label}</p>
                <p style={{fontSize:13,color:'#9ca3af',marginTop:3}}>
                  {s==='running'?'Ritmo · D+ · Segmentos · GPS real':s==='cycling'?'Velocidad · D+ · Segmentos · GPS real':'Run → T1 → Bike → T2 → Run · Transiciones GPS'}
                </p>
              </div>
              <div style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${sel?c.color:'#d1d5db'}`,background:sel?c.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,flexShrink:0}}>
                {sel?'✓':''}
              </div>
            </button>
          )
        })}
      </div>
      <div style={{padding:16,paddingBottom:'calc(env(safe-area-inset-bottom,0px)+16px)',borderTop:'1px solid #e5e7eb'}}>
        <button onClick={()=>setPhase('setup')}
          style={{width:'100%',padding:16,borderRadius:16,background:cfg.color,color:'#fff',fontWeight:800,fontSize:17,boxShadow:`0 4px 20px ${cfg.color}50`}}>
          Siguiente →
        </button>
      </div>
    </div>
  )
}
