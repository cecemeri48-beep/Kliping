-- v71: tabel Papan Rekor Bersama untuk Rehat Sejenak (folder rehat/).
-- Jalankan di Supabase -> SQL Editor. Aman diulang (idempotent).

-- 1. Tabel skor
create table if not exists rehat_skor (
  id bigint generated always as identity primary key,
  game text not null check (game in ('flyer','ngopi','puzzle')),
  nama text not null check (char_length(trim(nama)) between 1 and 24),
  skor integer not null check (skor between 0 and 100000),
  created_at timestamptz not null default now()
);

create index if not exists rehat_skor_game_skor_idx on rehat_skor (game, skor desc);

-- 2. RLS: publik boleh membaca & menulis tanpa akun, tapi hanya yang
--    lolos CHECK di atas (nama 1-24 huruf, skor wajar, game dikenal).
--    Tidak ada update/delete untuk publik.
alter table rehat_skor enable row level security;

drop policy if exists "rehat_baca_publik" on rehat_skor;
drop policy if exists "rehat_tulis_publik" on rehat_skor;

create policy "rehat_baca_publik" on rehat_skor for select using (true);
create policy "rehat_tulis_publik" on rehat_skor for insert with check (true);

-- v73: bila tabel sudah dibuat dari versi sebelumnya, perluas batasan game
-- agar game ketiga (puzzle / SUSUN) diterima.
alter table rehat_skor drop constraint if exists rehat_skor_game_check;
alter table rehat_skor add constraint rehat_skor_game_check check (game in ('flyer','ngopi','puzzle'));
