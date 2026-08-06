'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminSettingPage() {
  const supabase = createClientComponentClient();
  const [tarif, setTarif] = useState('50000');
  const [qris, setQris] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Ambil data konfigurasi aktif saat ini dari database Supabase
  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('sistem_config').select('*');
      if (data) {
        data.forEach(item => {
          if (item.key === 'tarif_iuran_wajib') setTarif(item.value);
          if (item.key === 'qris_payload') setQris(item.value);
        });
      }
    }
    loadConfig();
  }, [supabase]);

  // 2. Logika Fungsi Menyimpan Parameter Iuran & QRIS
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('sistem_config').upsert([
        { key: 'tarif_iuran_wajib', value: tarif },
        { key: 'qris_payload', value: qris }
      ]);

      if (error) throw error;

      alert('Konfigurasi parameter operasional RT berhasil disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan konfigurasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-200">⚙️ Pengaturan & Integrasi Sistem RT</h1>
        <p className="text-xs text-slate-400 mt-0.5">Kelola parameter tarif iuran berkala dan setup string payload QRIS warga</p>
      </div>

      <div className="bg-[#161925] border border-slate-800 p-6 rounded-xl space-y-5 shadow-2xl">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Parameter Operasional RT 09</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Nilai tarif di bawah ini akan menjadi acuan saat generator tagihan bulanan diterbitkan</p>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-5">
          <div>
            <label className="block text-[11px] mb-1.5 text-slate-400 font-medium">Tarif Iuran Wajib Bulanan (Rupiah)</label>
            <input 
              type="number" 
              className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500 transition font-mono" 
              value={tarif} 
              onChange={e => setTarif(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="block text-[11px] mb-1.5 text-slate-400 font-medium">Payload QRIS String (Standar EMVCO)</label>
            <textarea 
              className="w-full h-32 text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed" 
              value={qris} 
              onChange={e => setQris(e.target.value)} 
              placeholder="Contoh: 00020101021126570011ID..." 
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xs py-2.5 rounded font-semibold transition tracking-wide shadow-lg shadow-indigo-600/10"
            >
              {loading ? 'Menyimpan Parameter Sistem...' : 'Simpan Parameter Operasional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
