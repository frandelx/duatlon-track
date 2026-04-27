import React from 'react'
import type { Screen } from '@/types'

const TABS: {key:Screen;icon:string;label:string}[] = [
  {key:'feed',    icon:'🏠', label:'Inicio'},
  {key:'map',     icon:'🗺️', label:'Mapa'},
  {key:'record',  icon:'⏺',  label:'Grabar'},
  {key:'explore', icon:'🔍', label:'Explorar'},
  {key:'profile', icon:'👤', label:'Yo'},
]

export const TabBar: React.FC<{active:Screen; onChange:(s:Screen)=>void}> = ({active, onChange}) => (
  <nav style={{
    position:'fixed', bottom:0, left:0, right:0, zIndex:200,
    background:'#fff', borderTop:'1px solid #e5e7eb',
    paddingBottom:'env(safe-area-inset-bottom,0px)',
    display:'flex', alignItems:'stretch',
  }}>
    {TABS.map(tab => {
      const isRec = tab.key==='record'
      const isActive = active===tab.key
      return (
        <button key={tab.key} onClick={()=>onChange(tab.key)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center',
          padding:'10px 4px 8px', gap:3, opacity:isActive?1:.45, transition:'opacity .15s',
        }}>
          {isRec ? (
            <div style={{
              width:52, height:52, borderRadius:'50%',
              background:isActive?'#15803d':'#16a34a',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, marginTop:-22, color:'#fff',
              boxShadow:'0 2px 16px rgba(22,163,74,.5)',
              border:'3px solid #fff',
            }}>⏺</div>
          ) : (
            <span style={{fontSize:24, lineHeight:1}}>{tab.icon}</span>
          )}
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:.2,
            color:isActive?'#16a34a':'#9ca3af',
            marginTop:isRec?2:0,
          }}>{tab.label}</span>
        </button>
      )
    })}
  </nav>
)
