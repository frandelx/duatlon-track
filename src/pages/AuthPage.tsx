import React, { useState } from 'react'
import { SPORT } from '@/constants/sports'
import type { Sport } from '@/types'

interface Props {
  onSignIn: (email: string, password: string) => Promise<string|null>
  onSignUp: (email: string, password: string, username: string, sport: string) => Promise<string|null>
}

export const AuthPage: React.FC<Props> = ({ onSignIn, onSignUp }) => {
  const [mode, setMode]         = useState<'login'|'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [sport, setSport]       = useState<Sport>('duathlon')
  const [error, setError]       = useState<string|null>(null)
  const [loading, setLoading]   = useState(false)

  const handle = async () => {
    setError(null)
    if (!email || !password) { setError('Introduce email y contraseña'); return }
    if (mode === 'register' && !username) { setError('Introduce un nombre de usuario'); return }
    setLoading(true)
    const err = mode === 'login'
      ? await onSignIn(email, password)
      : await onSignUp(email, password, username, sport)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div style={{ height:'100%', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 24px', paddingTop:'calc(var(--safe-top) + 24px)', paddingBottom:'calc(var(--safe-bottom) + 24px)' }}>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ width:72, height:72, borderRadius:22, background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(22,163,74,.3)' }}>🏆</div>
        <h1 style={{ fontWeight:900, fontSize:26, color:'#111827' }}>Duatlón Track</h1>
        <p style={{ fontSize:14, color:'#6b7280', marginTop:4 }}>Tu compañero de entrenamiento</p>
      </div>

      {/* Tab switch */}
      <div style={{ display:'flex', background:'#f0f0f0', borderRadius:12, padding:4, marginBottom:24, width:'100%' }}>
        {(['login','register'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError(null) }}
            style={{ flex:1, padding:'10px 0', borderRadius:9, fontWeight:700, fontSize:14, transition:'all .2s',
              background:mode===m?'#fff':'transparent', color:mode===m?'#111827':'#9ca3af',
              boxShadow:mode===m?'0 1px 4px rgba(0,0,0,.1)':'none' }}>
            {m === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
        {mode === 'register' && (
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Nombre de usuario"
            style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'14px 16px', fontSize:16, outline:'none', color:'#111827' }}/>
        )}
        <input value={email} onChange={e => setEmail(e.target.value)}
          type="email" placeholder="Email"
          style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'14px 16px', fontSize:16, outline:'none', color:'#111827' }}/>
        <input value={password} onChange={e => setPassword(e.target.value)}
          type="password" placeholder="Contraseña"
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'14px 16px', fontSize:16, outline:'none', color:'#111827' }}/>

        {/* Sport selector (register only) */}
        {mode === 'register' && (
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#6b7280', marginBottom:8 }}>Deporte principal</p>
            <div style={{ display:'flex', gap:8 }}>
              {(Object.keys(SPORT) as Sport[]).map(s => {
                const c = SPORT[s]; const sel = sport === s
                return (
                  <button key={s} onClick={() => setSport(s)}
                    style={{ flex:1, padding:'10px 4px', borderRadius:12, border:`2px solid ${sel?c.color:c.border}`, background:sel?c.bg:'#fff', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all .2s' }}>
                    <span style={{ fontSize:22 }}>{c.emoji}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:sel?c.color:'#9ca3af' }}>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ width:'100%', padding:'12px 16px', borderRadius:12, background:'#fef2f2', border:'1px solid #fecaca', color:'#ef4444', fontSize:14, marginBottom:16 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button onClick={handle} disabled={loading}
        style={{ width:'100%', padding:'16px', borderRadius:14, background:'#16a34a', color:'#fff', fontWeight:800, fontSize:16, boxShadow:'0 4px 20px rgba(22,163,74,.35)', opacity:loading?.7:1, transition:'opacity .2s' }}>
        {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>

      <p style={{ fontSize:13, color:'#9ca3af', marginTop:20, textAlign:'center' }}>
        Gratis durante los primeros 6 meses 🎉
      </p>
    </div>
  )
}
