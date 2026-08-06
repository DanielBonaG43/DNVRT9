export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 font-sans flex flex-col">
      {/* Navbar Atas Universal Khusus Admin */}
      <nav className="bg-[#161925] border-b border-slate-800 px-6 py-3.5 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold text-sm tracking-wider flex items-center gap-2 hover:opacity-80">
            <span className="bg-amber-600 text-[10px] px-2 py-0.5 rounded text-white font-mono">RT 09</span>
            KENDALI UTAMA
          </Link>
          
          {/* Tautan Navigasi Cepat Antar Modul */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <Link href="/admin/warga" className="hover:text-white transition">Warga</Link>
            <Link href="/admin/konfirmasi-iuran" className="hover:text-white transition">Verifikasi Iuran</Link>
            <Link href="/admin/iuran" className="hover:text-white transition">Tagihan Massal</Link>
            <Link href="/admin/surat" className="hover:text-white transition">Persuratan</Link>
            <Link href="/admin/pengumuman" className="hover:text-white transition">Pengumuman</Link>
            <Link href="/admin/logistik-kas" className="hover:text-white transition">Kas & Logistik</Link>
          </div>
        </div>

        <Link href="/dashboard" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">
          Ke Dashboard Warga
        </Link>
      </nav>

      {/* Konten Utama Halaman Admin */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
