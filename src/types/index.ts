export type Sport = 'running' | 'cycling' | 'duathlon'
export type Screen = 'feed' | 'map' | 'record' | 'explore' | 'profile'
export type MapStyle = 'standard' | 'satellite' | 'hybrid'

export interface Profile {
  id: string; username: string; name: string; avatar_url?: string
  sport: Sport; location?: string; bio?: string
  followers_count: number; following_count: number; activities_count: number
}
export interface Activity {
  id: string; user_id: string; profile?: Profile; type: Sport; title: string
  distance_m: number; duration_s: number; elevation_m: number
  avg_hr?: number; avg_pace?: number; avg_speed?: number
  gps_points?: [number,number][]; created_at: string
  kudos_count: number; comments_count: number; has_kudos?: boolean
}
export interface Comment {
  id: string; activity_id: string; user_id: string; profile?: Profile
  body: string; created_at: string
}
export interface Message {
  id: string; from_id: string; to_id: string; from_profile?: Profile
  body: string; read: boolean; created_at: string
}
