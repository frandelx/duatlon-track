import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL as string || 'https://pokjyjsatawiqoitixmw.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBva2p5anNhdGF3aXFvaXRpeG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTE1ODksImV4cCI6MjA5MjQyNzU4OX0.xh3mFEWHOlD6UvdhJRzvPMaFrvC_6I_RS2ZPspMrJoo'
export const supabase = createClient(url, key)
