import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Message } from '@/types'

// ── NOTIFICATIONS ──────────────────────────────────────────────
export const NotificationsPage: React.FC<{ onBack:()=>void; myProfile:Profile|null }> = ({ onBack, myProfile }) => {
  const [notifs, setNotifs] = useState<any[]>([])

  useEffect(() => {
    // Demo notifications until real ones exist
    setNotifs([
      { id:'n1', type:'kudos',   avatar:'🚴', name:'Marc Bosch',  text:'felicitó tu actividad',          time:'Hace 5m',  read:false },
      { id:'n2', type:'follow',  avatar:'🏃', name:'Pau Ribas',   text:'empezó a seguirte',              time:'Hace 20m', read:false },
      { id:'n3', type:'comment', avatar:'🏆', name:'Marta Vidal', text:'comentó en tu actividad',        time:'Hace 1h',  read:false },
      { id:'n4', type:'segment', avatar:'⭐', name:'Sistema',     text:'Nuevo Top 10 en Subida Tibidabo', time:'Hace 2h',  read:false },
      { id:'n5', type:'kudos',   avatar:'⚡', name:'Jordi Ferrer','text':'y 3 más felicitaron tu actividad',time:'Ayer',   read:true  },
    ])
  }, [])

  const ICONS: Record<string,string> = { kudos:'👏', follow:'👤', comment:'💬', segment:'🏆' }
  const unread = notifs.filter(n=>!n.read).length

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      <div style={{ padding:'calc(var(--safe-top)+14px) 16px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ fontSize:26, color:'#16a34a', fontWeight:700, lineHeight:1 }}>‹</button>
          <h2 style={{ fontWeight:800, fontSize:20, color:'#111827' }}>
            Notificaciones {unread > 0 && <span style={{ fontSize:13, background:'#ef4444', color:'#fff', borderRadius:20, padding:'2px 8px', marginLeft:6 }}>{unread}</span>}
          </h2>
        </div>
        {unread > 0 && (
          <button onClick={() => setNotifs(p=>p.map(n=>({...n,read:true})))} style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>Marcar todas</button>
        )}
      </div>
      <div className="scroll" style={{ flex:1, background:'#f7f7fa' }}>
        {notifs.map(n => (
          <div key={n.id} onClick={() => setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))}
            style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', background:n.read?'#fff':'#f0fdf4', borderBottom:'1px solid #e5e7eb', cursor:'pointer' }}>
            {!n.read && <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a', flexShrink:0, marginTop:6 }}/>}
            <div style={{ width:46, height:46, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, position:'relative' }}>
              {n.avatar}
              <div style={{ position:'absolute', bottom:-2, right:-2, width:20, height:20, borderRadius:'50%', background:'#fff', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
                {ICONS[n.type]||'📣'}
              </div>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, color:'#111827', lineHeight:1.4 }}><strong>{n.name}</strong> {n.text}</p>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MESSAGES ───────────────────────────────────────────────────
export const MessagesPage: React.FC<{ onBack:()=>void; myProfile:Profile|null }> = ({ onBack, myProfile }) => {
  const [conversations, setConversations] = useState<any[]>([])
  const [openConv, setOpenConv]   = useState<any|null>(null)
  const [messages, setMessages]   = useState<any[]>([])
  const [text, setText]           = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Demo conversations
    setConversations([
      { id:'c1', name:'Marc Bosch',  avatar:'🚴', preview:'Qué tal fue el duatlón del sábado?', time:'10:24', unread:true  },
      { id:'c2', name:'Pau Ribas',   avatar:'🏃', preview:'Nos vemos el domingo para el trail?',time:'Ayer',  unread:true  },
      { id:'c3', name:'Jordi Ferrer',avatar:'⚡', preview:'Mira este segmento que encontré...',  time:'Lun',  unread:false },
      { id:'c4', name:'Marta Vidal', avatar:'🏅', preview:'Gracias por los kudos! 💚',            time:'Dom',  unread:false },
    ])
  }, [])

  const openChat = (conv: any) => {
    setOpenConv(conv)
    setConversations(p => p.map(c => c.id===conv.id ? {...c,unread:false} : c))
    setMessages([
      { id:'m1', me:false, text: conv.preview, time:'Antes' },
    ])
  }

  const send = () => {
    if (!text.trim()) return
    setMessages(p => [...p, { id:Date.now(), me:true, text:text.trim(), time:'Ahora' }])
    setText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
  }

  if (openConv) return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#f7f7fa' }}>
      <div style={{ padding:'calc(var(--safe-top)+12px) 16px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => setOpenConv(null)} style={{ fontSize:26, color:'#16a34a', fontWeight:700, lineHeight:1 }}>‹</button>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{openConv.avatar}</div>
        <div>
          <p style={{ fontWeight:700, fontSize:15, color:'#111827' }}>{openConv.name}</p>
          <p style={{ fontSize:11, color:'#9ca3af' }}>Atleta</p>
        </div>
      </div>
      <div className="scroll" style={{ flex:1, padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display:'flex', justifyContent:m.me?'flex-end':'flex-start' }}>
            <div style={{ maxWidth:'78%', padding:'10px 14px', borderRadius:18, background:m.me?'#16a34a':'#fff', color:m.me?'#fff':'#111827', fontSize:14, lineHeight:1.4, boxShadow:'0 1px 4px rgba(0,0,0,.08)', borderBottomRightRadius:m.me?4:18, borderBottomLeftRadius:m.me?18:4 }}>
              {m.text}
              <div style={{ fontSize:10, opacity:.6, marginTop:4, textAlign:m.me?'right':'left' }}>{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:'10px 12px', paddingBottom:'calc(env(safe-area-inset-bottom,0px)+10px)', background:'#fff', borderTop:'1px solid #e5e7eb', display:'flex', gap:10 }}>
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Escribe un mensaje..."
          style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:22, padding:'10px 16px', fontSize:14, outline:'none' }}/>
        <button onClick={send}
          style={{ width:42, height:42, borderRadius:'50%', background:'#16a34a', color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>↑</button>
      </div>
    </div>
  )

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      <div style={{ padding:'calc(var(--safe-top)+14px) 16px 12px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ fontSize:26, color:'#16a34a', fontWeight:700, lineHeight:1 }}>‹</button>
        <h2 style={{ fontWeight:800, fontSize:20, color:'#111827' }}>Mensajes</h2>
        <button style={{ marginLeft:'auto', padding:'7px 14px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', fontWeight:600, fontSize:13, border:'1px solid #bbf7d0' }}>+ Nuevo</button>
      </div>
      <div className="scroll" style={{ flex:1, background:'#f7f7fa' }}>
        {conversations.map(c => (
          <button key={c.id} onClick={() => openChat(c)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:c.unread?'#f0fdf4':'#fff', borderBottom:'1px solid #e5e7eb', width:'100%', textAlign:'left' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'#f7f7fa', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, position:'relative' }}>
              {c.avatar}
              {c.unread && <div style={{ position:'absolute', top:0, right:0, width:14, height:14, borderRadius:'50%', background:'#16a34a', border:'2px solid #fff' }}/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <p style={{ fontWeight:c.unread?800:600, fontSize:15, color:'#111827' }}>{c.name}</p>
                <p style={{ fontSize:12, color:'#9ca3af' }}>{c.time}</p>
              </div>
              <p style={{ fontSize:13, color:c.unread?'#374151':'#9ca3af', fontWeight:c.unread?500:400, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{c.preview}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── SETTINGS ───────────────────────────────────────────────────
export const SettingsPage: React.FC<{ onBack:()=>void; myProfile:Profile|null; onSignOut:()=>void }> = ({ onBack, myProfile, onSignOut }) => {
  const [units,    setUnits]    = useState<'km'|'mi'>('km')
  const [sport,    setSport]    = useState(myProfile?.sport ?? 'duathlon')
  const [notifs,   setNotifs]   = useState(true)
  const [privacy,  setPrivacy]  = useState('followers')
  const [heart,    setHeart]    = useState(false)
  const [darkMap,  setDarkMap]  = useState(false)

  const Toggle: React.FC<{on:boolean;onChange:()=>void}> = ({on,onChange}) => (
    <div onClick={onChange} style={{ width:48, height:28, borderRadius:14, background:on?'#16a34a':'#d1d5db', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left:on?23:3, width:22, height:22, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)', transition:'left .2s' }}/>
    </div>
  )

  const Sec: React.FC<{title:string;children:React.ReactNode}> = ({title,children}) => (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.5, padding:'0 16px 8px' }}>{title}</p>
      <div style={{ background:'#fff', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }}>{children}</div>
    </div>
  )

  const Row: React.FC<{label:string;sub?:string;right:React.ReactNode;last?:boolean}> = ({label,sub,right,last}) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:last?'none':'1px solid #f0f0f0' }}>
      <div><p style={{ fontSize:15, fontWeight:500, color:'#111827' }}>{label}</p>{sub&&<p style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{sub}</p>}</div>
      {right}
    </div>
  )

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#f7f7fa' }}>
      <div style={{ padding:'calc(var(--safe-top)+14px) 16px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ fontSize:26, color:'#16a34a', fontWeight:700, lineHeight:1 }}>‹</button>
        <h2 style={{ fontWeight:800, fontSize:20, color:'#111827' }}>Ajustes</h2>
      </div>

      <div className="scroll" style={{ flex:1, paddingTop:16, paddingBottom:40 }}>
        <Sec title="Cuenta">
          <Row label="Email" sub={myProfile?.username ?? '—'} right={<span style={{ fontSize:13, color:'#9ca3af' }}>{myProfile?.name}</span>}/>
          <Row label="Deporte principal" last right={
            onChange={e=>{setSport(e.target.value)}}
              style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', fontSize:14, color:'#374151', background:'#f7f7fa', outline:'none' }}>
              <option value="running">🏃 Running</option>
              <option value="cycling">🚴 Ciclismo</option>
              <option value="duathlon">🏆 Duatlón</option>
            </select>
          }/>
        </Sec>

        <Sec title="Privacidad">
          <Row label="Visibilidad del perfil" last right={
            <select value={privacy} onChange={e=>setPrivacy(e.target.value)}
              style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px', fontSize:14, color:'#374151', background:'#f7f7fa', outline:'none' }}>
              <option value="public">Público</option>
              <option value="followers">Solo seguidores</option>
              <option value="private">Privado</option>
            </select>
          }/>
        </Sec>

        <Sec title="Visualización">
          <Row label="Unidades de distancia" right={
            <div style={{ display:'flex', background:'#f0f0f0', borderRadius:8, overflow:'hidden', border:'1px solid #e5e7eb' }}>
              {(['km','mi'] as const).map(u => (
                <button key={u} onClick={()=>setUnits(u)}
                  style={{ padding:'6px 14px', fontSize:13, fontWeight:700, background:units===u?'#16a34a':'transparent', color:units===u?'#fff':'#6b7280' }}>
                  {u}
                </button>
              ))}
            </div>
          }/>
          <Row label="Mapa oscuro" sub="Modo nocturno" right={<Toggle on={darkMap} onChange={()=>setDarkMap(p=>!p)}/>} last/>
        </Sec>

        <Sec title="Dispositivos">
          <Row label="Sensor frecuencia cardíaca" sub="Conectar via Bluetooth" right={<Toggle on={heart} onChange={()=>setHeart(p=>!p)}/>} last/>
        </Sec>

        <Sec title="Notificaciones">
          <Row label="Notificaciones push" sub="Kudos, comentarios, seguidores" right={<Toggle on={notifs} onChange={()=>setNotifs(p=>!p)}/>} last/>
        </Sec>

        <Sec title="Datos">
          <Row label="Exportar actividades" sub="Formato GPX, FIT, CSV" right={<span style={{ color:'#16a34a', fontWeight:600, fontSize:14 }}>Exportar</span>}/>
          <Row label="Plan actual" sub="Gratis — primeros 6 meses" last right={
            <span style={{ fontSize:13, fontWeight:700, color:'#16a34a', background:'#f0fdf4', padding:'4px 10px', borderRadius:20 }}>Activo</span>
          }/>
        </Sec>

        <div style={{ padding:'0 16px 8px' }}>
          <button onClick={onSignOut}
            style={{ width:'100%', padding:'14px', borderRadius:14, background:'#fef2f2', color:'#ef4444', fontWeight:700, fontSize:15, border:'1px solid #fecaca' }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
