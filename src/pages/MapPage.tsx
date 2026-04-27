import React, { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import type { MapStyle } from '@/types'

const TILES: Record<MapStyle,{url:string;name:string;icon:string}> = {
  standard:  { name:'Estándar',  icon:'🗺️', url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  satellite: { name:'Satélite',  icon:'🛰️', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  hybrid:    { name:'Híbrido',   icon:'🌍', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
}

export const MapPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map|null>(null)
  const tileRef      = useRef<L.TileLayer|null>(null)
  const labelRef     = useRef<L.TileLayer|null>(null)
  const [style, setStyle]         = useState<MapStyle>('standard')
  const [showPicker, setShowPicker] = useState(false)
  const [located, setLocated]     = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center:[41.39,2.17], zoom:13, zoomControl:false, attributionControl:false })
    tileRef.current = L.tileLayer(TILES.standard.url, { maxZoom:19 }).addTo(map)

    // Demo routes
    L.polyline([[41.385,2.173],[41.390,2.185],[41.398,2.195],[41.405,2.188],[41.410,2.175]], { color:'#16a34a', weight:4, opacity:.8, lineCap:'round' }).addTo(map)
    L.polyline([[41.380,2.160],[41.374,2.150],[41.368,2.140],[41.362,2.148],[41.358,2.162]], { color:'#2563eb', weight:4, opacity:.8, lineCap:'round' }).addTo(map)
    L.polyline([[41.395,2.160],[41.400,2.170],[41.408,2.165],[41.412,2.155],[41.405,2.145]], { color:'#9333ea', weight:4, opacity:.8, lineCap:'round' }).addTo(map)

    const icon = L.divIcon({ html:`<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.3)"></div>`, className:'', iconSize:[16,16], iconAnchor:[8,8] })
    L.marker([41.390,2.172], { icon }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  const changeStyle = (s: MapStyle) => {
    setStyle(s); setShowPicker(false)
    if (!mapRef.current || !tileRef.current) return
    mapRef.current.removeLayer(tileRef.current)
    if (labelRef.current) { mapRef.current.removeLayer(labelRef.current); labelRef.current = null }
    tileRef.current = L.tileLayer(TILES[s].url, { maxZoom:19 }).addTo(mapRef.current)
    if (s === 'hybrid') {
      labelRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, opacity:.4 }).addTo(mapRef.current)
    }
  }

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 16); setLocated(true) },
      () => alert('No se pudo obtener tu ubicación')
    )
  }

  return (
    <div style={{ height:'100%', position:'relative' }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }}/>

      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:50, background:'rgba(255,255,255,.95)', backdropFilter:'blur(8px)', borderBottom:'1px solid #e5e7eb', padding:'calc(var(--safe-top)+12px) 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontWeight:800, fontSize:20, color:'#111827' }}>Mapa</h2>
        <div style={{ position:'relative' }}>
          <button onClick={() => setShowPicker(p=>!p)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:20, background:'#f7f7fa', border:'1px solid #e5e7eb', fontWeight:600, fontSize:13, color:'#374151' }}>
            {TILES[style].icon} {TILES[style].name} ▾
          </button>
          {showPicker && (
            <div style={{ position:'absolute', right:0, top:42, background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, boxShadow:'0 4px 20px rgba(0,0,0,.12)', overflow:'hidden', zIndex:200, minWidth:155 }}>
              {(Object.keys(TILES) as MapStyle[]).map(s => (
                <button key={s} onClick={() => changeStyle(s)}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', fontSize:14, fontWeight:style===s?700:500, color:style===s?'#16a34a':'#374151', background:style===s?'#f0fdf4':'#fff', borderBottom:s!=='hybrid'?'1px solid #f0f0f0':'none' }}>
                  {TILES[s].icon} {TILES[s].name}
                  {style===s && <span style={{ marginLeft:'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ position:'absolute', top:'calc(var(--safe-top)+72px)', left:12, zIndex:50, background:'rgba(255,255,255,.92)', borderRadius:12, padding:'10px 14px', boxShadow:'0 2px 10px rgba(0,0,0,.1)', border:'1px solid #e5e7eb' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Mis rutas</p>
        {[{c:'#16a34a',l:'🏃 Running'},{c:'#2563eb',l:'🚴 Ciclismo'},{c:'#9333ea',l:'🏆 Duatlón'}].map((r,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:i<2?4:0 }}>
            <div style={{ width:24, height:4, borderRadius:2, background:r.c }}/>
            <span style={{ fontSize:12, fontWeight:500, color:'#374151' }}>{r.l}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ position:'absolute', right:12, bottom:100, zIndex:50, display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={locate} style={{ width:44, height:44, borderRadius:'50%', background:'#fff', border:'1px solid #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,.12)', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {located ? '📍' : '🎯'}
        </button>
        <button onClick={() => mapRef.current?.zoomIn()} style={{ width:44, height:44, borderRadius:12, background:'#fff', border:'1px solid #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,.12)', fontSize:22, fontWeight:800, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        <button onClick={() => mapRef.current?.zoomOut()} style={{ width:44, height:44, borderRadius:12, background:'#fff', border:'1px solid #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,.12)', fontSize:22, fontWeight:800, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
      </div>
    </div>
  )
}
