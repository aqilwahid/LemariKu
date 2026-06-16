-- ============================================================
--  LemariKu — Setup database & keamanan (Supabase)
--  Cara pakai: Supabase Dashboard → SQL Editor → New query →
--  tempel SELURUH isi file ini → Run.
-- ============================================================

-- 1) Profil pengguna (dipakai untuk menghitung & membatasi jumlah user)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- 2) Katalog pakaian (lemari)
create table if not exists public.items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  category   text not null,
  color      text,
  photo      text,                         -- foto disimpan sebagai data URL
  status     text not null default 'Di Lemari',
  created_at timestamptz not null default now()
);

-- 3) Batch laundry
create table if not exists public.batches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label      text,
  vendor     text not null,
  due        date,
  item_ids   jsonb not null default '[]'::jsonb,
  code       text,
  seq        integer,
  created    date,
  created_at timestamptz not null default now()
);

create index if not exists items_user_idx   on public.items(user_id);
create index if not exists batches_user_idx on public.batches(user_id);

-- 4) Aktifkan Row Level Security (WAJIB — ini yang melindungi data tiap user)
alter table public.profiles enable row level security;
alter table public.items    enable row level security;
alter table public.batches  enable row level security;

-- 5) Kebijakan akses: tiap user hanya boleh menyentuh datanya sendiri
-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- items
drop policy if exists "items_select_own" on public.items;
create policy "items_select_own" on public.items for select using (auth.uid() = user_id);
drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own" on public.items for insert with check (auth.uid() = user_id);
drop policy if exists "items_update_own" on public.items;
create policy "items_update_own" on public.items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own" on public.items for delete using (auth.uid() = user_id);

-- batches
drop policy if exists "batches_select_own" on public.batches;
create policy "batches_select_own" on public.batches for select using (auth.uid() = user_id);
drop policy if exists "batches_insert_own" on public.batches;
create policy "batches_insert_own" on public.batches for insert with check (auth.uid() = user_id);
drop policy if exists "batches_update_own" on public.batches;
create policy "batches_update_own" on public.batches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "batches_delete_own" on public.batches;
create policy "batches_delete_own" on public.batches for delete using (auth.uid() = user_id);

-- 6) Saat ada user baru daftar: buat profil + BATASI maksimum 10 pengguna.
--    Pendaftaran ke-11 dst. akan ditolak otomatis oleh database.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.profiles) >= 10 then
    raise exception 'Pendaftaran penuh: batas 10 pengguna telah tercapai.';
  end if;
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7) Berbagi tautan publik (halaman /l/<kode>)
--    Pengunjung TANPA login boleh melihat SATU batch — hanya jika tahu kodenya.
--    Fungsi ini "security definer" sehingga bisa membaca data milik user lain,
--    TAPI hanya mengembalikan batch yang kodenya cocok + foto/nama pakaiannya.
--    Tidak ada cara mengintip batch lain karena kode bersifat acak & rahasia.
create or replace function public.get_shared_batch(p_code text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'label',   b.label,
    'vendor',  b.vendor,
    'due',     b.due,
    'created', b.created,
    'count',   coalesce(jsonb_array_length(b.item_ids), 0),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',     i.name,
        'category', i.category,
        'color',    i.color,
        'photo',    i.photo
      ) order by i.created_at desc)
      from public.items i
      where i.id::text in (select jsonb_array_elements_text(b.item_ids))
    ), '[]'::jsonb)
  )
  from public.batches b
  where b.code = p_code
  limit 1;
$$;

-- Hanya boleh dipanggil sebagai RPC (tidak membuka akses tabel langsung).
revoke all on function public.get_shared_batch(text) from public;
grant execute on function public.get_shared_batch(text) to anon, authenticated;

-- ============================================================
--  Selesai.
--  Disarankan: Authentication → Providers → Email → matikan
--  "Confirm email" agar pengguna bisa langsung masuk setelah daftar.
-- ============================================================
