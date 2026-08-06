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

  // 1. Ambil data iuran warga yang berstatus 'Belum Lunas' tapi memiliki catatan tanggal kirim (Menunggu Verifikasi)
  // Untuk efisiensi kuota data, kita melakukan JOIN relasional ke profil warga
  const fetchPendingIuran = async () => {
    const { data, error } = await supabase
      .from('iuran')
      .select(`
        id, nama_tagihan, bulan, nominal, tanggal_bayar, status,
        profiles (nama, blok_rumah, no_whatsapp)
      `)
      .eq('status', 'Belum Lunas')
      .not('tanggal_bayar', 'is', null) // Trik deteksi warga yang sudah upload bukti
      .order('tanggal_bayar', { ascending: true });

    if (!error && data) {
      setListPending(data);
    }
  };

  useEffect(() => {
    fetchPendingIuran();
  }, []);

  // 2. Logika Fungsi APPROVE (Setujui Pembayaran)
  const handleApprove = async (idIuran: string) => {
    setLoadingId(idIuran);
    try {
      const { error } = await supabase
        .from('iuran')
        .update({ 
          status: 'Lunas',
          tanggal_bayar: new Date().toISOString()
        })
        .eq('id', idIuran);

      if (error) throw error;
      
      // Refresh data lokal setelah berhasil
      setListPending(prev => prev.filter(item => item.id !== idIuran));
      router.refresh();
    } catch (err: any) {
      alert('Gagal menyetujui pembayaran: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // 3. Logika Fungsi REJECT (Tolak Pembayaran jika Bukti Palsu/Salah)
  const handleReject = async (idIuran: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak bukti pembayaran ini? Warga harus mengunggah ulang.')) return;
    
    setLoadingId(idIuran);
    try {
      const { error } = await supabase
        .from('iuran')
        .update({ 
          status: 'Belum Lunas',
          tanggal_bayar: null // Reset tanggal kirim agar warga bisa upload ulang
        })
        .eq('id', idIuran);

      if (error) throw error;

      setListPending(prev => prev.filter(item => item.id !== idIuran));
      router.refresh();
    } catch (err: any) {
      alert('Gagal menolak pembayaran: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Filter pencarian berdasarkan nama warga atau blok
  const filteredData = listPending.filter(item => {
    const namaWarga = item.profiles?.nama?.toLowerCase() || '';
    const blokRumah = item.profiles?.blok_rumah?.toLowerCase() || '';
    return namaWarga.includes(filterText.toLowerCase()) || blokRumah.includes(filterText.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="bg-amber-600 text-[10px] px-2 py-0.5 rounded text-white font-mono">ADMIN PANEL</span>
              Persetujuan Iuran Warga
            </h1>
            <p className="text-xs text-slate-400 mt-1">Daftar konfirmasi pembayaran manual yang diajukan oleh warga</p>
          </div>
          
          <input 
            type="text" 
            placeholder="Cari nama warga atau blok..." 
            className="text-xs p-2 bg-[#161925] border border-slate-800 rounded-lg w-full md:w-64 focus:outline-none focus:border-indigo-500 text-slate-300"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>

        {/* Tabel Data Pending */}
        <div className="bg-[#161925] border border-slate-800 rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="pb-3">Warga / Blok</th>
                <th className="pb-3">Jenis Iuran</th>
                <th className="pb-3">Bulan</th>
                <th className="pb-3">Nominal</th>
                <th className="pb-3">Tanggal Kirim</th>
                <th className="pb-3 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/10">
                    <td className="py-3.5">
                      <p className="font-semibold text-slate-200">{item.profiles?.nama || 'Tanpa Nama'}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Blok {item.profiles?.blok_rumah || '-'}</p>
                    </td>
                    <td className="py-3.5 font-medium text-slate-300">{item.nama_tagihan}</td>
                    <td className="py-3.5 text-slate-400">{item.bulan || '-'}</td>
                    <td className="py-3.5 font-bold text-indigo-400">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 text-slate-400">
                      {item.tanggal_bayar ? new Date(item.tanggal_bayar).toLocaleDateString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {/* Tombol Lihat Bukti */}
                        <a 
                          href={`https://supabase.co{item.id}_`} // Sesuaikan domain Supabase Anda
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-[11px] transition"
                        >
                          Lihat Bukti
                        </a>
                        
                        {/* Tombol Approve */}
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={loadingId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-3 py-1.5 rounded font-medium text-[11px] transition"
                        >
                          {loadingId === item.id ? '...' : 'Setuju'}
                        </button>

                        {/* Tombol Reject */}
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={loadingId !== null}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1.5 rounded text-[11px] transition"
                        >
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada pengajuan pembayaran manual yang perlu dikonfirmasi saat ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
