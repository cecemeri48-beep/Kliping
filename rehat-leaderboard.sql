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

-- v75: PENGAMAN ANTI-DOBEL (jalankan sekali, aman diulang)
-- 1) Rapikan duplikat lama: simpan hanya skor tertinggi per game+nama
--    (nama tidak peka huruf besar/kecil; seri dibiarkan yang paling awal)
delete from rehat_skor a using rehat_skor b
 where a.game=b.game and lower(trim(a.nama))=lower(trim(b.nama))
   and (b.skor>a.skor or (b.skor=a.skor and b.created_at<a.created_at));
-- 2) Kunci unik: satu nama hanya boleh satu baris per game
create unique index if not exists rehat_skor_unik on rehat_skor (game, lower(trim(nama)));
-- 3) Penjaga di server: bila nama sudah ada, insert dibatalkan; baris lama
--    hanya ditimpa bila skor baru lebih tinggi. Jadi nama tidak bisa dobel
--    sekalipun dua pemain kirim bersamaan.
create or replace function rehat_skor_guard() returns trigger
language plpgsql security definer set search_path=public as $$
declare old_id bigint; old_skor int;
begin
  select id,skor into old_id,old_skor from rehat_skor
   where game=new.game and lower(trim(nama))=lower(trim(new.nama)) limit 1;
  if old_id is not null then
    if new.skor>old_skor then
      update rehat_skor set skor=new.skor, created_at=now() where id=old_id;
    end if;
    return null;
  end if;
  return new;
end $$;
drop trigger if exists rehat_skor_guard on rehat_skor;
create trigger rehat_skor_guard before insert on rehat_skor for each row execute function rehat_skor_guard();
