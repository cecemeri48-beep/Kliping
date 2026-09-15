-- rehat-kunci-ngopi-v90.sql
-- Jalankan setelah restart Ngopi. Aman dijalankan ulang.
-- Mempertahankan fungsi skor terbaru sebagai fungsi inti, lalu memasang
-- pemeriksa tambahan di depannya.

create table if not exists public.rehat_penolakan (
  id bigint generated always as identity primary key,
  game text,
  nama text,
  skor_laporan integer,
  waktu_laporan integer,
  langkah integer,
  nonce text,
  durasi_server integer,
  alasan text not null,
  tercatat_at timestamptz not null default now()
);
alter table public.rehat_penolakan enable row level security;
revoke all on table public.rehat_penolakan from anon, authenticated;

-- Simpan fungsi aktif sebagai inti. Ini tidak menimpa logika Flyer/Puzzle terbaru.
do $$
begin
  if to_regprocedure('public.rehat_kirim_skor_inti_v90(text,text,integer,text,integer,integer,text)') is null then
    if to_regprocedure('public.rehat_kirim_skor(text,text,integer,text,integer,integer,text)') is null then
      raise exception 'rehat_kirim_skor dengan 7 parameter tidak ditemukan';
    end if;
    execute 'alter function public.rehat_kirim_skor(text,text,integer,text,integer,integer,text) rename to rehat_kirim_skor_inti_v90';
  end if;
end $$;

revoke all on function public.rehat_kirim_skor_inti_v90(text,text,integer,text,integer,integer,text)
from public, anon, authenticated;

create or replace function public.rehat_kirim_skor(
  p_game text,
  p_nama text,
  p_skor integer,
  p_level text default '',
  p_waktu integer default null,
  p_langkah integer default null,
  p_nonce text default null
) returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_nama text := btrim(coalesce(p_nama,''));
  v_game_nonce text;
  v_mulai timestamptz;
  v_dipakai boolean;
  v_durasi integer;
  v_efektif integer;
  v_plafon integer;
  v_hasil integer;
begin
  if p_game is null or p_game not in ('flyer','ngopi','puzzle') then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,'game tidak dikenal');
    return null;
  end if;

  if char_length(v_nama) < 1 or char_length(v_nama) > 24 then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,'nama kosong/tidak sah');
    return null;
  end if;

  if p_nonce is null or char_length(p_nonce) < 8 or char_length(p_nonce) > 64 then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,'nonce kosong/tidak sah');
    return null;
  end if;

  -- Kunci baris nonce untuk mencegah dua pengiriman bersamaan.
  select n.game,n.created_at,n.dipakai
    into v_game_nonce,v_mulai,v_dipakai
  from public.rehat_nonce n
  where n.nonce=p_nonce
  for update;

  if not found then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,'nonce tidak terdaftar');
    return null;
  end if;

  if v_dipakai then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,'nonce sudah dipakai');
    return null;
  end if;

  if v_game_nonce is distinct from p_game then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,'nonce berasal dari game lain');
    return null;
  end if;

  v_durasi := greatest(0,floor(extract(epoch from (clock_timestamp()-v_mulai)))::integer);

  if p_game='ngopi' then
    if p_waktu is null or p_waktu < 1 or p_waktu > 900 then
      insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,durasi_server,alasan)
      values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,v_durasi,'durasi Ngopi harus 1–900 detik');
      return null;
    end if;

    -- 15 menit bermain + 15 detik toleransi jaringan.
    if v_durasi > 915 then
      insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,durasi_server,alasan)
      values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,v_durasi,'ronde Ngopi melewati batas server');
      return null;
    end if;

    v_efektif := least(p_waktu,v_durasi+15);
    v_plafon := 12 + ceil(v_efektif*4.8)::integer;
    if p_skor is null or p_skor <= 0 or p_skor > v_plafon then
      insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,durasi_server,alasan)
      values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,v_durasi,'skor Ngopi melampaui plafon v90');
      return null;
    end if;
  end if;

  v_hasil := public.rehat_kirim_skor_inti_v90(
    p_game,v_nama,p_skor,coalesce(p_level,''),p_waktu,p_langkah,p_nonce
  );
  if v_hasil is null then
    insert into public.rehat_penolakan(game,nama,skor_laporan,waktu_laporan,langkah,nonce,durasi_server,alasan)
    values(p_game,v_nama,p_skor,p_waktu,p_langkah,p_nonce,v_durasi,'ditolak pemeriksaan fungsi inti');
  end if;
  return v_hasil;
end $$;

revoke all on function public.rehat_kirim_skor(text,text,integer,text,integer,integer,text) from public;
grant execute on function public.rehat_kirim_skor(text,text,integer,text,integer,integer,text) to anon, authenticated;

-- Tutup jalur tulis tabel secara langsung.
alter table public.rehat_skor enable row level security;
alter table public.rehat_nonce enable row level security;
revoke insert,update,delete,truncate on public.rehat_skor from anon,authenticated;
revoke insert,update,delete,truncate on public.rehat_nonce from anon,authenticated;

-- Verifikasi. Nilai yang benar: true,true,true,false dan skor Ngopi 0
-- bila dipasang langsung setelah restart.
select
  to_regprocedure('public.rehat_kirim_skor(text,text,integer,text,integer,integer,text)') is not null as wrapper_aktif,
  to_regprocedure('public.rehat_kirim_skor_inti_v90(text,text,integer,text,integer,integer,text)') is not null as fungsi_inti_aman,
  has_function_privilege('anon','public.rehat_kirim_skor(text,text,integer,text,integer,integer,text)','EXECUTE') as anon_boleh_wrapper,
  has_function_privilege('anon','public.rehat_kirim_skor_inti_v90(text,text,integer,text,integer,integer,text)','EXECUTE') as anon_boleh_fungsi_inti,
  (select count(*) from public.rehat_skor where game='ngopi') as skor_ngopi_saat_ini;

-- Audit admin:
-- select * from public.rehat_penolakan order by tercatat_at desc limit 100;
