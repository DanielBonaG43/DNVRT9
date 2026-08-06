export const dynamic = 'force-dynamic';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // Proteksi Role Sisi Server
  const { data: profile } = user ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : { data: null };
  if (!profile || profile.role === 'warga') {
    return <div className="min-h-screen bg-[#0F111A] text-red-400 p-8 text-xs font-mono">Akses Ditolak. Khusus Pengurus RT.</div>;
  }

  // Tarik Agregasi Data Instan
  const { count: totalWarga } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'warga');
  const { count: pendingSurat } = await supabase.from('surat').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
  const { count: pendingPinjam } = await supabase.from('peminjaman_inventaris').select('*', { count: 'exact', head: true }).eq('status', 'Pending');

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 p-6 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-amber-600 text-xs px-2 py-0.5 rounded text-white font-mono">PANEL PENGURUS</span>
            Pusat Kendali RT 09
          </h1>
          <p className="text-xs text-slate-400 mt-1">Kelola data keuangan, administrasi warga, dan inventarisasi lingkungan</p>
        </div>
        <Link href="/dashboard" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition">Ke Dasbor Warga</Link>
      </header>

      {/* Grid Statistik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#161925] p-5 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400">Total Warga Terdaftar</span>
          <p className="text-2xl font-bold text-white mt-1">{totalWarga || 0} Kepala Keluarga</p>
        </div>
        <div className="bg-[#161925] p-5 border border-slate-800 rounded-xl">
          <span className="text-xs text-amber-400">Pengajuan Surat Tertunda</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingSurat || 0} Berkas</p>
        </div>
        <div className="bg-[#161925] p-5 border border-slate-800 rounded-xl">
          <span className="text-xs text-indigo-400">Peminjaman Inventaris Aktif</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{pendingPinjam || 0} Permohonan</p>
        </div>
      </div>

      {/* Menu Navigasi Modul Admin */}
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Pilih Modul Manajemen</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: "Manajemen Data Warga", href: "/admin/warga", desc: "Tambah, edit, dan hapus biodata dasar warga RT." },
          { name: "Konfirmasi Iuran Manual", href: "/admin/konfirmasi-iuran", desc: "Cek bukti transfer dan approve iuran manual warga." },
          { name: "Pembuat Tagihan Iuran", href: "/admin/iuran", desc: "Buat tagihan wajib bulanan atau iuran insidentil massal." },
          { name: "Persetujuan Surat Mandiri", href: "/admin/surat", desc: "Approve pengajuan surat domisili & pengantar warga." },
          { name: "Kelola Pengumuman RT", href: "/admin/pengumuman", desc: "Buat info dengan editor mini-HTML & approval kegiatan." },
          { name: "Inventaris & Kas RT", href: "/admin/logistik-kas", desc: "Input barang pinjaman dan catat pengeluaran keuangan bulanan." }
        ].map((menu, i) => (
          <Link key={i} href={menu.href} className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">{menu.name}</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{menu.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
