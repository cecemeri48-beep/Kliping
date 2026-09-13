-- ===========================================================================
--  rehat-skor-adil-v82.sql
--  Jalankan SETELAH rehat-leaderboard-v80.sql.
--  Aman dijalankan berulang kali (create or replace).
--
--  Memperbaiki dua ketidakadilan pada pencatatan skor SUSUN LOGO:
--
--   1. Poin di papan lebih kecil daripada di layar kemenangan.
--      Sisi pemain tidak mengenakan biaya untuk putaran, sisi server memotong
--      8 poin untuk setiap tukar DAN putar. Setiap ronde selisihnya puluhan poin.
--
--   2. Ronde cepat yang jujur ditolak tanpa pemberitahuan.
--      Server mensyaratkan >= 0,35 detik per langkah (~2,9 langkah/detik),
--      padahal sisi pemain mengizinkan sampai 12,5 aksi/detik. Pemain 3x3 yang
--      mahir kehilangan skornya begitu saja.
--
--  Tidak ada perubahan tabel, kebijakan, atau tanda tangan fungsi -- hanya isi
--  fungsi rehat_kirim_skor. Unsur keberuntungan permainan tidak disentuh.
-- ===========================================================================

create or replace function public.rehat_kirim_skor(
  p_game    text,
  p_nama    text,
  p_skor    integer,
  p_level   text    default '',
  p_waktu   integer default null,
  p_langkah integer default null,
  p_nonce   text    default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nama   text;
  v_level  text;
  v_skor   integer;
  v_basis  integer;
  v_plafon integer;
  v_minlangkah integer;
  v_minwaktu   integer;
  v_lama   integer;
  v_banyak integer;
begin
  -- ---------- nama ----------
  v_nama := btrim(coalesce(p_nama, ''));
  if char_length(v_nama) < 1 or char_length(v_nama) > 24 then
    return null;
  end if;

  -- ---------- game ----------
  if p_game is null or p_game not in ('flyer','ngopi','puzzle') then
    return null;
  end if;

  -- ---------- level ----------
  v_level := coalesce(p_level, '');
  if p_game = 'puzzle' then
    if v_level not in ('3x3','4x4','5x5') then return null; end if;
  else
    v_level := '';
  end if;

  -- ---------- durasi wajib & wajar ----------
  if p_waktu is null or p_waktu < 1 or p_waktu > 7200 then
    return null;
  end if;
  if p_langkah is not null and (p_langkah < 0 or p_langkah > 20000) then
    return null;
  end if;

  -- ---------- rem laju per nama ----------
  select count(*) into v_banyak
    from public.rehat_nonce
   where nama = lower(v_nama)
     and created_at > now() - interval '10 minutes';
  if v_banyak >= 30 then
    return null;
  end if;

  -- ---------- nonce sekali pakai ----------
  if p_nonce is null or char_length(p_nonce) < 8 or char_length(p_nonce) > 64 then
    return null;
  end if;
  begin
    insert into public.rehat_nonce(nonce, game, nama)
    values (p_nonce, p_game, lower(v_nama));
  exception when unique_violation then
    return null;   -- ronde ini sudah pernah dikirim
  end;

  -- sapu bersih catatan nonce lama sesekali agar tabel tetap ringan
  if random() < 0.02 then
    delete from public.rehat_nonce where created_at < now() - interval '3 days';
  end if;

  -- =========================================================================
  -- HITUNG ULANG / BATASI SKOR DI SERVER — angka dari klien tidak dipercaya
  -- =========================================================================
  if p_game = 'puzzle' then
    if p_langkah is null then return null; end if;

    v_basis      := case v_level when '3x3' then 3000 when '5x5' then 9500 else 6000 end;
    -- Catatan v82: p_langkah sekarang bersatuan berbobot (tukar*2 + putar),
    -- jadi ambang di bawah ini otomatis jadi lebih longgar -- arah yang aman,
    -- karena batas minimum yang sebenarnya sudah dihitung tepat di sisi pemain
    -- lewat minAksi() (jarak siklus permutasi + sisa putaran).
    v_minlangkah := case v_level when '3x3' then 6    when '5x5' then 16   else 10   end;
    v_minwaktu   := case v_level when '3x3' then 3    when '5x5' then 12   else 6    end;

    -- mustahil menyusun dengan langkah/waktu di bawah batas ini
    if p_langkah < v_minlangkah then return null; end if;
    if p_waktu   < v_minwaktu   then return null; end if;
    -- batas kecepatan ketukan manusia
    -- PERBAIKAN v82: batas lama (0,35 detik per langkah = maks ~2,9 langkah/detik)
    -- jauh lebih ketat daripada aturan sisi pemain (maks 12,5 aksi/detik), jadi
    -- ronde 3x3 yang dimainkan cepat dan JUJUR ikut ditolak tanpa pemberitahuan.
    -- Batas kini disetarakan; ini cuma jaring kewajaran, sebab skor tetap dihitung
    -- ulang di server dan menaikkan p_langkah justru MENURUNKAN poin.
    if p_langkah > (p_waktu + 1) * 25 then return null; end if;

    -- rumus resmi puzzle, dihitung di server
    -- PERBAIKAN v82: dulu 'p_langkah * 8' sementara sisi pemain sama sekali tidak
    -- mengenakan biaya untuk putaran, jadi angka di papan selalu lebih kecil
    -- daripada yang tampil di layar kemenangan. Kini p_langkah dikirim dalam
    -- satuan berbobot (tukar*2 + putar) dan dikalikan 4, sehingga hasilnya
    -- identik dengan rumus pemain: tukar = 8 poin, putar = 4 poin.
    v_skor := greatest(10, least(v_basis, v_basis - p_waktu * 30 - p_langkah * 4));

  else
    -- arcade: skor dibatasi laju maksimum yang mungkin dicapai dalam p_waktu detik
    --   flyer : 1 pipa butuh >= ~0,8 detik  -> plafon 1,3 poin/detik
    --   ngopi : item terbaik 5 poin per ~0,4 detik -> plafon 13 poin/detik
    v_plafon := case p_game
                  when 'flyer' then 3  + ceil(p_waktu * 1.3)::int
                  else              12 + ceil(p_waktu * 13)::int
                end;
    v_skor := least(greatest(coalesce(p_skor, 0), 0), v_plafon);
  end if;

  if v_skor <= 0 or v_skor > 100000 then
    return null;
  end if;

  -- =========================================================================
  -- UPSERT: satu baris per (game, nama, level), hanya diganti bila lebih tinggi
  -- =========================================================================
  select skor into v_lama
    from public.rehat_skor
   where game = p_game
     and lower(btrim(nama)) = lower(v_nama)
     and level = v_level
   limit 1;

  if v_lama is null then
    begin
      insert into public.rehat_skor(game, nama, skor, level, waktu, langkah)
      values (p_game, v_nama, v_skor, v_level, p_waktu, p_langkah);
      return v_skor;
    exception when unique_violation then
      update public.rehat_skor
         set skor = v_skor, created_at = now(), waktu = p_waktu, langkah = p_langkah
       where game = p_game
         and lower(btrim(nama)) = lower(v_nama)
         and level = v_level
         and skor < v_skor;
      return v_skor;
    end;
  end if;

  if v_skor > v_lama then
    update public.rehat_skor
       set skor = v_skor, created_at = now(), waktu = p_waktu, langkah = p_langkah
     where game = p_game
       and lower(btrim(nama)) = lower(v_nama)
       and level = v_level;
    return v_skor;
  end if;

  return v_lama;   -- skor lama masih lebih baik, tidak diubah
end;
$$;

-- hanya fungsi ini yang boleh dipanggil publik
revoke all on function public.rehat_kirim_skor(text,text,integer,text,integer,integer,text) from public;
grant execute on function public.rehat_kirim_skor(text,text,integer,text,integer,integer,text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pemeriksaan cepat: pastikan fungsi terpasang dan bisa dieksekusi anon.
-- ---------------------------------------------------------------------------
select p.proname,
       pg_get_function_identity_arguments(p.oid) as argumen,
       p.prosecdef                               as security_definer
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname = 'rehat_kirim_skor';
