import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Ambil data profil pengguna aktif
  const { data: { session } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session?.id).single();

  // Kalkulasi agregasi kas secara berkala (Efisien & rendah trafik data)
  const { data: totalIuran } = await supabase.from('iuran').select('nominal').eq('status', 'Lunas');
  const { data: totalKeluar } = await supabase.from('pengeluaran_kas').select('nominal');
  
  const pemasukan = totalIuran?.reduce((sum, item) => sum + Number(item.nominal), 0) || 0;
  const pengeluaran = totalKeluar?.reduce((sum, item) => sum + Number(item.nominal), 0) || 0;
  const saldoBersih = pemasukan - pengeluaran;

  // Tarik data spesifik komponen dashboard
  const { data: tagihan } = await supabase.from('iuran').select('*').eq('user_id', session?.id).order('created_at', { ascending: false }).limit(5);
  const { data: barang } = await supabase.from('inventaris').select('*').limit(4);
  const { data: info } = await supabase.from('pengumuman').select('*').eq('status', 'Approved').order('created_at', { ascending: false }).limit(3);

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 p-6 font-sans">
      {/* Header Aplikasi */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded text-white">RT</span> 
            Halo, {profile?.nama || 'Warga'}
          </h1>
          <p className="text-xs text-slate-400">{profile?.blok_rumah || 'Blok Mandiri'} • De Naila Village</p>
        </div>
        <div className="flex items-center gap-4">
          {profile?.role !== 'warga' && <Link href="/admin" className="text-xs bg-amber-600 px-3 py-1.5 rounded hover:bg-amber-700">Panel Admin</Link>}
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">● Sistem Online</span>
        </div>
      </header>

      {/* Grid Konten Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri & Tengah: Finansial & Tagihan */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ringkasan Kas Transparansi */}
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-300">Kas Transparansi RT</h2>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Transparansi 100%</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Total Saldo Kas</span>
                <p className="text-lg font-bold text-white mt-1">Rp {saldoBersih.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800">
                <span className="text-xs text-emerald-400">▲ Total Pemasukan</span>
                <p className="text-lg font-bold text-white mt-1">Rp {pemasukan.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800">
                <span className="text-xs text-red-400">▼ Total Pengeluaran</span>
                <p className="text-lg font-bold text-white mt-1">Rp {pengeluaran.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Riwayat Tagihan / Kronologis Iuran */}
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4 text-slate-300">Riwayat Tagihan Iuran Anda</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Nama Tagihan</th>
                    <th className="pb-2">Bulan</th>
                    <th className="pb-2">Nominal</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {tagihan?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-3 font-medium">{item.nama_tagihan}</td>
                      <td className="py-3 text-slate-400">{item.bulan}</td>
                      <td className="py-3 font-semibold">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${item.status === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{item.status}</span>
                      </td>
                      <td className="py-3 text-right">
                        {item.status === 'Lunas' ? (
                          <button className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded">Kwitansi PDF</button>
                        ) : (
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-medium">Bayar QRIS</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Pengumuman, Inventaris, Persuratan */}
        <div className="space-y-6">
          
          {/* Papan Pengumuman RT */}
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Pengumuman RT</h2>
            <div className="space-y-3">
              {info?.map(p => (
                <div key={p.id} className="border-l-2 border-indigo-500 bg-[#0F111A] p-3 rounded-r-lg">
                  <h3 className="text-xs font-bold text-slate-200">{p.judul}</h3>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: p.konten_html }} />
                </div>
              ))}
            </div>
          </div>

          {/* Sistem Inventarisasi */}
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Peminjaman Inventaris</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {barang?.map(b => (
                <div key={b.id} className="bg-[#0F111A] p-2.5 border border-slate-800 rounded-lg flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-slate-200">{b.nama_barang}</p>
                    <p className="text-[10px] text-slate-500">{b.stok_tersedia} Unit Tersedia</p>
                  </div>
                  <button className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-1 rounded transition text-[11px]" disabled={b.stok_tersedia <= 0}>Pinjam</button>
                </div>
              ))}
            </div>
          </div>

          {/* Persuratan Mandiri */}
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Persuratan Mandiri</h2>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-[#0F111A] border border-slate-800 rounded-lg hover:border-indigo-500 text-left text-xs">
                <p className="font-semibold">Surat Domisili</p>
                <span className="text-[10px] text-slate-500">Ajukan online</span>
              </button>
              <button className="p-3 bg-[#0F111A] border border-slate-800 rounded-lg hover:border-indigo-500 text-left text-xs">
                <p className="font-semibold">Pengantar SKCK</p>
                <span className="text-[10px] text-slate-500">Persyaratan resmi</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
