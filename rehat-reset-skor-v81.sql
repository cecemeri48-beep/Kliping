-- =====================================================================
--  RESET PAPAN PERINGKAT "REHAT SEJENAK"  —  TANDING ULANG (v81)
--  Kliping RCS.CBS
-- ---------------------------------------------------------------------
--  CARA PAKAI:
--    Supabase -> SQL Editor -> New query -> tempel seluruh berkas -> Run.
--
--  URUTAN YANG BENAR:
--    1) rehat-leaderboard-v80.sql   (pengamanan skor — WAJIB, sekali saja)
--    2) rehat-reset-skor-v81.sql    (berkas ini — mengosongkan papan)
--
--  Kalau langkah 1 dilewati, papan yang baru dikosongkan bisa langsung
--  diisi skor palsu lagi lewat API publik.
--
--  PERINGATAN: berkas ini MENGHAPUS SEMUA skor dan TIDAK BISA dibatalkan.
--  BAGIAN 1 menyalin dulu skor lama ke tabel arsip, jadi masih ada rekam
--  jejak lomba sebelumnya bila suatu saat dibutuhkan.
-- =====================================================================


-- ---------------------------------------------------------------------
--  BAGIAN 1 — Arsipkan skor lama (aman dijalankan berulang)
--  Disimpan sebagai jsonb supaya tidak peduli kolom apa saja yang ada.
-- ---------------------------------------------------------------------
create table if not exists public.rehat_skor_arsip (
  arsip_id    bigint generated always as identity primary key,
  musim       text        not null default 'sebelum-v81',
  data        jsonb       not null,
  diarsip_at  timestamptz not null default now()
);

-- Arsip hanya untuk admin: RLS menyala tanpa satu pun policy,
-- jadi anon/authenticated tidak bisa membaca maupun menulis.
alter table public.rehat_skor_arsip enable row level security;
revoke all on table public.rehat_skor_arsip from anon, authenticated;

insert into public.rehat_skor_arsip (musim, data)
select 'sebelum-v81', to_jsonb(t)
from public.rehat_skor t;


-- ---------------------------------------------------------------------
--  BAGIAN 2 — Kosongkan papan peringkat
--  restart identity: penomoran id mulai dari 1 lagi.
-- ---------------------------------------------------------------------
truncate table public.rehat_skor restart identity;

-- Bersihkan juga catatan nonce anti-curang supaya tidak ada sisa
-- ronde lama yang menahan pengiriman skor pertama musim baru.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'rehat_nonce'
  ) then
    execute 'truncate table public.rehat_nonce';
  end if;
end $$;


-- ---------------------------------------------------------------------
--  BAGIAN 3 — Periksa hasil
--  Hasil yang benar: tabel skor KOSONG (0 baris), arsip berisi skor lama.
-- ---------------------------------------------------------------------
select 'skor aktif'  as tabel, count(*) as baris from public.rehat_skor
union all
select 'arsip lama'  as tabel, count(*) as baris from public.rehat_skor_arsip;

select game, count(*) as baris, coalesce(max(skor), 0) as tertinggi
from public.rehat_skor
group by game
order by game;


-- =====================================================================
--  CATATAN TAMBAHAN
-- ---------------------------------------------------------------------
--  * Rekor di HP masing-masing pemain ikut terhapus otomatis saat mereka
--    membuka game pertama kali setelah pembaruan ini (penanda musim
--    "reichas_musim = v81" di dalam puzzle.html / flyer.html / ngopi.html).
--    Nama pemain sengaja TIDAK dihapus agar tidak perlu diisi ulang.
--
--  * Kalau hanya ingin mengosongkan SATU game, jangan pakai BAGIAN 2.
--    Gunakan ini sebagai penggantinya (ganti nama game sesuai kebutuhan):
--
--      delete from public.rehat_skor where game = 'puzzle';
--      delete from public.rehat_nonce where game = 'puzzle';
--
--    Pilihan game yang sah: 'puzzle', 'flyer', 'ngopi'.
--
--  * Untuk membuka arsip musim lalu:
--
--      select musim,
--             data->>'game'  as game,
--             data->>'nama'  as nama,
--             (data->>'skor')::int as skor,
--             data->>'level' as level
--      from public.rehat_skor_arsip
--      order by (data->>'skor')::int desc
--      limit 50;
-- =====================================================================
