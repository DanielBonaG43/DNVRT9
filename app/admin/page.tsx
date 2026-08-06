export const dynamic = 'force-dynamic';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });

  // Tarik Agregasi Data Instan dari Tabel Akun Warga Privat
  const { count: totalWarga } = await supabase.from('akun_warga').select('*', { count: 'exact', head: true });
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
        <Link href="/admin/warga" className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">Manajemen Data Warga</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Tambah, edit, dan hapus biodata dasar warga RT.</p>
        </Link>
        <Link href="/admin/konfirmasi-iuran" className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">Konfirmasi Iuran Manual</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Cek bukti transfer dan approve iuran manual warga.</p>
        </Link>
        <Link href="/admin/iuran" className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">Pembuat Tagihan Iuran</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Buat tagihan wajib bulanan atau iuran insidentil massal.</p>
        </Link>
        <Link href="/admin/surat" className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">Persetujuan Surat Mandiri</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Approve pengajuan surat domisili & pengantar warga.</p>
        </Link>
        <Link href="/admin/pengumuman" className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">Kelola Pengumuman RT</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Buat info dengan editor mini-HTML & approval kegiatan.</p>
        </Link>
        <Link href="/admin/logistik-kas" className="bg-[#161925] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-xl transition text-left group">
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">Inventaris & Kas RT</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Input barang pinjaman dan catat pengeluaran keuangan bulanan.</p>
        </Link>
      </div>
    </div>
  );
}
