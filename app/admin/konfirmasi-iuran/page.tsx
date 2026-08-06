// Jalankan penggantian total kode pada file app/admin/konfirmasi-iuran/page.tsx Anda:
'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function AdminKonfirmasiIuranPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [listPending, setListPending] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  const fetchPendingIuran = async () => {
    const { data } = await supabase
      .from('iuran')
      .select(`
        id, nama_tagihan, bulan, nominal, tanggal_bayar, status,
        profiles (nama, blok_rumah, no_whatsapp)
      `)
      .eq('status', 'Belum Lunas')
      .not('tanggal_bayar', 'is', null)
      .order('tanggal_bayar', { ascending: true });

    if (data) setListPending(data);
  };

  useEffect(() => { fetchPendingIuran(); }, []);

  const handleApprove = async (idIuran: string) => {
    setLoadingId(idIuran);
    try {
      await supabase.from('iuran').update({ status: 'Lunas', tanggal_bayar: new Date().toISOString() }).eq('id', idIuran);
      setListPending(prev => prev.filter(item => item.id !== idIuran));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally { setLoadingId(null); }
  };

  const handleReject = async (idIuran: string) => {
    if (!confirm('Tolak bukti pembayaran ini?')) return;
    setLoadingId(idIuran);
    try {
      await supabase.from('iuran').update({ status: 'Belum Lunas', tanggal_bayar: null }).eq('id', idIuran);
      setListPending(prev => prev.filter(item => item.id !== idIuran));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally { setLoadingId(null); }
  };

  // FUNGSI UTAMA: Memicu pembukaan aplikasi WhatsApp klien secara gratis dengan teks template otomatis
  const pemicuKirimWhatsAppKlien = (noWa: string, namaWarga: string, tagihan: string, bulan: string, rupiah: number) => {
    const teksPesan = encodeURIComponent(
      `*PENGINGAT TAGIHAN RT MANDIRI*\n\nHalo Bpk/Ibu *${namaWarga}*,\nKami menginformasikan bahwa iuran *${tagihan}* periode *${bulan || '-'}* sebesar *Rp ${Number(rupiah).toLocaleString('id-ID')}* belum tercatat lunas di kas RT.\n\nMohon selesaikan pembayaran via aplikasi atau koordinasikan dengan Bendahara RT.\n\n Terima kasih.`
    );
    // Membuka tab baru yang otomatis memicu aplikasi WhatsApp Web atau WhatsApp Mobile di perangkat pengurus
    window.open(`https://wa.me{noWa}?text=${teksPesan}`, '_blank');
  };

  const filteredData = listPending.filter(item => {
    const name = item.profiles?.nama?.toLowerCase() || '';
    const block = item.profiles?.blok_rumah?.toLowerCase() || '';
    return name.includes(filterText.toLowerCase()) || block.includes(filterText.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-amber-600 text-[10px] px-2 py-0.5 rounded text-white font-mono">ADMIN PANEL</span>
              Persetujuan Iuran Warga
            </h1>
            <p className="text-xs text-slate-400 mt-1">Daftar konfirmasi pembayaran manual yang diajukan oleh warga</p>
          </div>
          <input type="text" placeholder="Cari nama warga..." className="text-xs p-2 bg-[#161925] border border-slate-800 rounded-lg w-full md:w-64 focus:outline-none" value={filterText} onChange={e => setFilterText(e.target.value)} />
        </div>

        <div className="bg-[#161925] border border-slate-800 rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold text-[10px]">
                <th className="pb-3">Warga / Blok</th>
                <th className="pb-3">Jenis Iuran</th>
                <th className="pb-3">Bulan</th>
                <th className="pb-3">Nominal</th>
                <th className="pb-3 text-center">Aksi Verifikasi & Komunikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/10">
                  <td className="py-3.5">
                    <p className="font-semibold text-slate-200">{item.profiles?.nama}</p>
                    <p className="text-[10px] text-slate-500">Blok {item.profiles?.blok_rumah}</p>
                  </td>
                  <td className="py-3.5 text-slate-300">{item.nama_tagihan}</td>
                  <td className="py-3.5 text-slate-400">{item.bulan || '-'}</td>
                  <td className="py-3.5 font-bold text-indigo-400">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                  <td className="py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {/* Tombol Pemicu WhatsApp Klien Otomatis */}
                      <button
                        onClick={() => pemicuKirimWhatsAppKlien(item.profiles?.no_whatsapp, item.profiles?.nama, item.nama_tagihan, item.bulan, item.nominal)}
                        className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded text-[11px] transition"
                      >
                        💬 Hubungi WA
                      </button>
                      <button onClick={() => handleApprove(item.id)} disabled={loadingId !== null} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-medium text-[11px] transition">Setuju</button>
                      <button onClick={() => handleReject(item.id)} disabled={loadingId !== null} className="bg-red-600/20 text-red-400 px-2.5 py-1.5 rounded text-[11px] transition">Tolak</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
