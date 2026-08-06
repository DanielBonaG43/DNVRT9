export const dynamic = 'force-dynamic';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });
  
  // 1. Ambil data user aktif dari sistem Auth Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Ambil data profil dari tabel profiles bawaan
  const { data: profile } = user 
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() 
    : { data: null };

  // 3. SINKRONISASI BERSAMA: Izinkan akses jika dia superadmin/admin di tabel profiles,
  // atau jika ada penanda email admin resmi (misal mengandung kata 'admin' atau '@')
  const isAdminFromAuth = profile?.role === 'superadmin' || profile?.role === 'admin';
  const isAdminFromSession = user?.email?.includes('admin') || user?.email?.includes('rt09');

  if (!isAdminFromAuth && !isAdminFromSession) {
    // Jika benar-benar warga biasa atau tidak punya akses, lempar balik ke dasbor warga agar tidak eror polosan
    redirect('/dashboard');
  }

  // Tarik Agregasi Data Instan (Sisa kode di bawahnya tetap sama persis seperti sebelumnya)
  const { count: totalWarga } = await supabase.from('akun_warga').select('*', { count: 'exact', head: true });
  const { count: pendingSurat } = await supabase.from('surat').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
  const { count: pendingPinjam } = await supabase.from('peminjaman_inventaris').select('*', { count: 'exact', head: true }).eq('status', 'Pending');

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 p-6 font-sans">
      {/* Sisa UI Konten Menu Utama Admin Anda tetap sama di bawah ini... */}
