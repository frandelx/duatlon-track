# Duatlón Track v4 — Setup completo

## 1. Instalar y arrancar
```bash
npm install
npm run dev
```
Abre http://localhost:5173

## 2. SQL en Supabase (SQL Editor → Run)

```sql
-- Perfiles
create table if not exists profiles (
  id                uuid primary key references auth.users on delete cascade,
  username          text unique not null,
  name              text,
  avatar_url        text,
  sport             text default 'duathlon',
  location          text,
  bio               text,
  followers_count   int default 0,
  following_count   int default 0,
  activities_count  int default 0,
  created_at        timestamptz default now()
);

-- Actividades
create table if not exists activities (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id) on delete cascade,
  type            text not null,
  title           text,
  distance_m      float default 0,
  duration_s      int default 0,
  elevation_m     float default 0,
  avg_hr          int,
  avg_pace        int,
  avg_speed       float,
  gps_points      jsonb,
  kudos_count     int default 0,
  comments_count  int default 0,
  created_at      timestamptz default now()
);

-- Kudos
create table if not exists kudos (
  activity_id uuid references activities(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (activity_id, user_id)
);

-- Comentarios
create table if not exists comments (
  id          uuid primary key default uuid_generate_v4(),
  activity_id uuid references activities(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz default now()
);

-- Seguidores
create table if not exists follows (
  follower_id  uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);

-- RLS
alter table profiles    enable row level security;
alter table activities  enable row level security;
alter table kudos       enable row level security;
alter table comments    enable row level security;
alter table follows     enable row level security;

-- Policies
create policy "profiles_public"   on profiles   for select using (true);
create policy "profiles_own"      on profiles   for all    using (auth.uid() = id);
create policy "activities_public" on activities for select using (true);
create policy "activities_own"    on activities for all    using (auth.uid() = user_id);
create policy "kudos_public"      on kudos      for select using (true);
create policy "kudos_own"         on kudos      for all    using (auth.uid() = user_id);
create policy "comments_public"   on comments   for select using (true);
create policy "comments_own"      on comments   for insert with check (auth.uid() = user_id);
create policy "follows_public"    on follows    for select using (true);
create policy "follows_own"       on follows    for all    using (auth.uid() = follower_id);

-- Storage para fotos de perfil
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
create policy "avatars_public" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_own"    on storage.objects for all using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
```

## 3. Variables en Vercel
Settings → Environment Variables:
- VITE_SUPABASE_URL = https://pokjyjsatawiqoitixmw.supabase.co
- VITE_SUPABASE_ANON_KEY = tu_clave_anon

## 4. Publicar
```bash
git add .
git commit -m "Duatlon Track v4 - version real"
git push
```
Vercel despliega automáticamente.
