import { serve } from "https://deno.land";
import { createClient } from "https://esm.sh";

const FONNTE_API_TOKEN = Deno.env.get("FONNTE_TOKEN") || "TOKEN_KAMU_DISINI";

serve(async (req) => {
  // Inisialisasi Klien Supabase internal dengan hak akses Service Role (Bypass RLS)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Ambil data tagihan "Belum Lunas" dan hubungkan (JOIN) dengan tabel profiles warga
    const { data: listTagihan, error: dbError } = await supabaseClient
      .from("iuran")
      .select(`
        nama_tagihan, bulan, nominal,
        profiles (nama, no_whatsapp, blok_rumah)
      `)
      .eq("status", "Belum Lunas");

    if (dbError) throw dbError;
    if (!listTagihan || listTagihan.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada tunggakan iuran aktif." }), { status: 200 });
    }

    let berhasilDikirim = 0;

    // 2. Looping data tagihan untuk ditembakkan ke API Whatsapp Gateway
    for (const tagihan of listTagihan) {
      // @ts-ignore - Struktur join tabel relasional
      const warga = tagihan.profiles;
      if (!warga || !warga.no_whatsapp) continue;

      const pesanText = `*PENGINGAT TAGIHAN RT MANDIRI*\n\nHalo Bpk/Ibu *${warga.nama}* (Blok ${warga.blok_rumah}),\nKami menginformasikan bahwa iuran *${tagihan.nama_tagihan}* untuk periode *${tagihan.bulan}* sebesar *Rp ${Number(tagihan.nominal).toLocaleString('id-ID')}* belum tercatat lunas.\n\nMohon lakukan pembayaran via QRIS m-banking melalui dasbor aplikasi warga sebelum tanggal jatuh tempo.\n\n_Pesan otomatis dari Pengurus RT 09_`;

      const responseWA = await fetch("https://fonnte.com", {
        method: "POST",
        headers: {
          "Authorization": FONNTE_API_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          target: warga.no_whatsapp,
          message: pesanText,
          countryCode: "62" // Penyetelan kode negara otomatis Indonesia
        })
      });

      if (responseWA.ok) berhasilDikirim++;
    }

    return new Response(JSON.stringify({ success: true, total_notifikasi: berhasilDikirim }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
