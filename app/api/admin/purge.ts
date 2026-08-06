import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Ambil data user yang aktif (Memperbaiki error properti 'session')
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Sesi tidak valid. Silakan login kembali.' }, { status: 401 });
  }

  // 2. Ambil profil untuk memastikan perannya adalah Superadmin menggunakan user.id
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (dbError || !profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak. Tindakan ini hanya untuk Superadmin.' }, { status: 403 });
  }

  try {
    // 3. Eksekusi pembersihan data awal aplikasi (Danger Zone)
    await supabase.from('peminjaman_inventaris').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('iuran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('surat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pengeluaran_kas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    return NextResponse.json({ success: true, message: 'Seluruh data transaksi berhasil dibersihkan total.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
