-- HemoExplorer: roster siswa tanpa akun (login hanya nama + kelas).
-- Tabel ini terpisah dari public.profiles (yang mengasumsikan auth.users)
-- karena alur login siswa saat ini tidak membuat akun Supabase Auth.
-- Hanya diakses lewat backend (service role / secret key) sehingga RLS
-- sengaja tidak diberi policy untuk anon/authenticated.

create table public.offline_students (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  class_name text not null check (class_name ~ '^Kelas VI-[A-Z]$'),
  avatar text not null default '🎒',
  mudah text not null default '-',
  sedang text not null default '-',
  sulit text not null default '-',
  pbl text not null default '0 Kasus',
  pbl_score smallint not null default 0 check (pbl_score between 0 and 100),
  status text not null default 'Baru Masuk',
  notes text not null default '',
  joined_at timestamptz not null default now(),
  last_active timestamptz,
  login_time timestamptz,
  unique (name, class_name)
);

create index offline_students_class_name_idx on public.offline_students(class_name);

alter table public.offline_students enable row level security;
revoke all on public.offline_students from anon, authenticated;

comment on table public.offline_students is
  'Roster siswa untuk alur login nama+kelas (tanpa akun). Hanya diakses via backend dengan secret key, bypass RLS.';
