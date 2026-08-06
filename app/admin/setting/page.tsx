'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminSettingPage() {
  const supabase = createClientComponentClient();
  const [tarif, setTarif] = useState('50000');
  const [waKey, setWaKey] = useState('');
  const [qris, setQris] = useState('');
  const [loading, setLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // 1. Ambil data konfigurasi aktif dari database
  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('sistem_config').select('*');
      if (data) {
        data.forEach(item => {
          if (item.key === 'tarif_iuran_wajib') setTarif(item.value);
          if (item.key === 'wa_api_key') setWaKey(item.value);
          if (item.key === 'qris_payload') setQris(item.value);
        });
      }
    }
    loadConfig();
  }, [supabase]);

  // 2. Logika Menyimpan Konfigurasi Global
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('sistem_config').upsert([
        { key: 'tarif_iuran_wajib', value: tarif },
        { key: 'wa_api_key', value: waKey },
        { key: 'qris_payload', value: qris }
      ]);
      alert('Konfigurasi sistem berhasil diperbarui!');
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Logika Bersihkan Data Awal / Reset Sistem (DANGER ZONE)
  const handlePurgeData = async () => {
    const konfirmasi1 = confirm('PERINGATAN KERAS! Tindakan ini akan menghapus SELURUH data iuran, transaksi kas, permohonan surat, dan peminjaman barang. Lanjutkan?');
    if (!konfirmasi1) return;

    const konfirmasi2 = prompt('Untuk mengonfirmasi tindakan berbahaya ini, silakan ketik kata kunci: HAPUS_DATA_AWAL');
    if (konfirmasi2 !== 'HAPUS_DATA_AWAL') return alert('Konfirmasi gagal. Data aman.');

    setPurgeLoading(true);
    try {
      const res = await fetch('/api/admin/purge', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert('Sukses! Seluruh data aplikasi telah dibersihkan dan di-reset ke nol.');
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert('Gagal mengeksekusi reset data: ' + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-200">Pengaturan Sistem & Konfigurasi Aplikasi</h1>
        <p className="text-xs text-slate-400 mt-0.5">Kelola parameter keuangan, integrasi gateway, dan pemeliharaan basis data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Form Setup Utility */}
        <form onSubmit={handleSaveConfig} className="lg:col-span-2 bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Konfigurasi Operasional RT</h2>
          
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Tarif Ketetapan Iuran Wajib Bulanan (Rp)</label>
            <input type="number" className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={tarif} onChange={e => setTarif(e.target.value)} required />
          </div>

          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Token API WhatsApp Gateway (Fonnte / Wablas)</label>
            <input type="password" className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 font-mono focus:outline-none focus:border-indigo-500" value={waKey} onChange={e => setWaKey(e.target.value)} placeholder="Masukkan token API gateway Anda" />
          </div>

          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Payload Kode QRIS Statis (String EMVCO)</label>
            <textarea className="w-full h-24 text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 font-mono focus:outline-none focus:border-indigo-500" value={qris} onChange={e => setQris(e.target.value)} placeholder="00020101021126570011ID..." />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs py-2.5 rounded font-semibold transition">
            {loading ? 'Menyimpan Perubahan...' : 'Simpan Parameter Sistem'}
          </button>
        </form>

        {/* Zona Bahaya (DANGER ZONE) */}
        <div className="bg-[#161925] border border-red-900/30 bg-red-900/5 p-5 rounded-xl flex flex-col justify-between h-fit space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">⚠ DANGER ZONE</h2>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Fungsi di bawah ini akan **membersihkan seluruh tabel operasional secara permanen** dari database. Digunakan hanya untuk membersihkan data demo awal aplikasi sebelum diserahterimakan ke pengurus RT asli.
            </p>
          </div>

          <button 
            type="button" 
            onClick={handlePurgeData}
            disabled={purgeLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2.5 rounded font-semibold transition"
          >
            {purgeLoading ? 'Menghancurkan Data...' : 'Wipe / Bersihkan Data Awal'}
          </button>
        </div>
      </div>
    </div>
  );
}
