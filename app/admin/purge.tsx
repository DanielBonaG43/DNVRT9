import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  // Autentikasi ketat server-side untuk memastikan pengeksekusi adalah Superadmin
  const { data: { session } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session?.id).single();

  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Akses ditolak. Tindakan ini hanya untuk Superadmin.' }, { status: 403 });
  }

  try {
    // Menghapus data transaksi, iuran, peminjaman, surat, dan warga secara berurutan sesuai relasi database
    await supabase.from('peminjaman_inventaris').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('iuran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('surat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pengeluaran_kas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Catatan: Jika ingin menghapus warga secara massal, pastikan menghapus di skema auth.users via admin API
    return NextResponse.json({ success: true, message: 'Seluruh data transaksi dan entitas berhasil dibersihkan total.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
