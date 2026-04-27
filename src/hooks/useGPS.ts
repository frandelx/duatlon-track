import { useState, useRef, useCallback } from 'react'

export interface GpsPoint { lat: number; lng: number; alt: number; ts: number; speed: number }

export function useGPS() {
  const [points, setPoints]     = useState<GpsPoint[]>([])
  const [current, setCurrent]   = useState<GpsPoint|null>(null)
  const [error, setError]       = useState<string|null>(null)
  const [tracking, setTracking] = useState(false)
  const watchId = useRef<number|null>(null)

  const start = useCallback(() => {
    if (!navigator.geolocation) { setError('GPS no disponible'); return }
    setPoints([]); setTracking(true); setError(null)
    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        const pt: GpsPoint = {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          alt: pos.coords.altitude ?? 0, ts: pos.timestamp,
          speed: pos.coords.speed ?? 0,
        }
        setCurrent(pt)
        setPoints(p => [...p, pt])
      },
      err => setError('Error GPS: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    )
  }, [])

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = null
    setTracking(false)
  }, [])

  const distanceM = points.reduce((total, pt, i) => {
    if (i === 0) return 0
    const prev = points[i-1]
    const R = 6371000
    const dLat = (pt.lat - prev.lat) * Math.PI / 180
    const dLng = (pt.lng - prev.lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(prev.lat*Math.PI/180)*Math.cos(pt.lat*Math.PI/180)*Math.sin(dLng/2)**2
    return total + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }, 0)

  const elevGain = points.reduce((g, pt, i) => {
    if (i === 0) return 0
    const diff = pt.alt - points[i-1].alt
    return g + (diff > 0 ? diff : 0)
  }, 0)

  return { points, current, error, tracking, distanceM, elevGain, start, stop }
}
