export const SPORT = {
  running:  { label:'Running',  emoji:'🏃', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', dark:'#15803d' },
  cycling:  { label:'Ciclismo', emoji:'🚴', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', dark:'#1d4ed8' },
  duathlon: { label:'Duatlón',  emoji:'🏆', color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', dark:'#7e22ce' },
}

export function fmtTime(s: number) {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60
  return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`
}
export function fmtDist(m: number) { return `${(m/1000).toFixed(2)} km` }
export function fmtPace(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} /km` }
export function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60) return 'Ahora'
  if (d < 3600) return `Hace ${Math.floor(d/60)}m`
  if (d < 86400) return `Hace ${Math.floor(d/3600)}h`
  return `Hace ${Math.floor(d/86400)}d`
}
