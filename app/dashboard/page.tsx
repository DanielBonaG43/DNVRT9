export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import LogoutButton from './LogoutButton'; // DIKUNCI SATU FOLDER

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = user 
    ? await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle() 
    : { data: null };

  const { data: totalIuran } = await supabase.from('iuran').select('nominal').eq('status', 'Lunas');
  const { data: totalKeluar } = await supabase.from('pengeluaran_kas').select('nominal');
  
  const pemasukan = totalIuran?.reduce((sum, item) => sum + Number(item.nominal || 0), 0) || 0;
  const pengeluaran = totalKeluar?.reduce((sum, item) => sum + Number(item.nominal || 0), 0) || 0;
  const saldoBersih = pemasukan - pengeluaran;

  const { data: tagihan } = user 
    ? await supabase.from('iuran').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    : { data: [] };
    
  const { data: barang } = await supabase.from('inventaris').select('*').limit(4);
  const { data: info } = await supabase.from('pengumuman').select('*').eq('status', 'Approved').order('created_at', { ascending: false }).limit(3);

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded text-white">RT</span> 
            Halo, {profile?.nama || 'Warga'}
          </h1>
          <p className="text-xs text-slate-400">Blok {profile?.blok_rumah || '-'} • De Naila Village</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.role && profile.role !== 'warga' && (
            <Link href="/admin" className="text-xs bg-amber-600 px-3 py-1.5 rounded hover:bg-amber-700 transition">Panel Admin</Link>
          )}
          <LogoutButton />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Kas Transparansi RT</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Total Saldo Kas</span>
                <p className="text-base font-bold text-white mt-1">Rp {saldoBersih.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800">
                <span className="text-[11px] text-emerald-400">▲ Pemasukan</span>
                <p className="text-base font-bold text-emerald-400 mt-1">Rp {pemasukan.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800">
                <span className="text-[11px] text-red-400">▼ Pengeluaran</span>
                <p className="text-base font-bold text-red-400 mt-1">Rp {pengeluaran.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Riwayat Tagihan Iuran Anda</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-medium">
                    <th className="pb-2">Nama Tagihan</th>
                    <th className="pb-2">Bulan</th>
                    <th className="pb-2">Nominal</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {tagihan && tagihan.length > 0 ? (
                    tagihan.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/10">
                        <td className="py-3 font-medium text-slate-200">{item.nama_tagihan}</td>
                        <td className="py-3 text-slate-400">{item.bulan || '-'}</td>
                        <td className="py-3 font-semibold">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.status === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{item.status}</span>
                        </td>
                        <td className="py-3 text-right">
                          {item.status === 'Lunas' ? (
                            <Link href={`/api/kuitansi/${item.id}`} className="inline-block text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded transition">Kwitansi PDF</Link>
                          ) : (
                            <Link href={`/dashboard/bayar-manual/${item.id}`} className="inline-block text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-medium transition">Bayar Manual</Link>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">Belum ada data tagihan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Pengumuman RT</h2>
            <div className="space-y-3">
              {info && info.length > 0 ? (
                info.map(p => (
                  <div key={p.id} className="border-l-2 border-indigo-500 bg-[#0F111A] p-3 rounded-r-lg">
                    <h3 className="text-xs font-bold text-slate-200">{p.judul}</h3>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: p.konten_html }} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Tidak ada pengumuman baru.</p>
              )}
            </div>
          </div>

          <div className="bg-[#161925] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Inventaris RT</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {barang?.map(b => (
                <div key={b.id} className="bg-[#0F111A] p-2.5 border border-slate-800 rounded-lg flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-slate-200">{b.nama_barang}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{b.stok_tersedia} Tersedia</p>
                  </div>
                  <button className="w-full mt-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white py-1 rounded transition text-[11px]" disabled={b.stok_tersedia <= 0}>Pinjam</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
