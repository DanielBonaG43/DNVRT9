'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminSettingPage() {
  const supabase = createClientComponentClient();
  const [tarif, setTarif] = useState('50000');
  const [qris, setQris] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State khusus WhatsApp Web JS gratis
  const [waStatus, setWaStatus] = useState('Checking...');
  const [qrImg, setQrImg] = useState('');

  // 1. Fungsi memeriksa status koneksi WhatsApp ke API internal kita
  const checkWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp');
      const data = await res.json();
      setWaStatus(data.status);
      setQrImg(data.qrImage);
    } catch (e) {
      setWaStatus('Error Connecting API');
    }
  };

  useEffect(() => {
    // Jalankan pengecekan otomatis setiap 5 detik untuk memantau status scan QR
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

    const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // PERBAIKAN: Hapus .withConverter(null) agar sesuai standar Postgrest Supabase
      const { error } = await supabase.from('sistem_config').upsert([
        { key: 'tarif_iuran_wajib', value: tarif },
        { key: 'qris_payload', value: qris }
      ]);

      if (error) throw error;

      alert('Konfigurasi parameter iuran berhasil disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-200">⚙️ Pengaturan & Integrasi Sistem RT</h1>
        <p className="text-xs text-slate-400 mt-0.5">Kelola gerbang pembayaran QRIS dan aktivasi bot WhatsApp tanpa biaya</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Set KAS & QRIS */}
        <form onSubmit={handleSaveConfig} className="lg:col-span-2 bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Parameter Operasional</h2>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Tarif Iuran Wajib Bulanan (Rp)</label>
            <input type="number" className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none" value={tarif} onChange={e => setTarif(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Payload QRIS String (EMVCO)</label>
            <textarea className="w-full h-24 text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 font-mono" value={qris} onChange={e => setQris(e.target.value)} placeholder="0002010102112657..." />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs py-2.5 rounded font-semibold transition">
            {loading ? 'Menyimpan...' : 'Simpan Parameter'}
          </button>
        </form>

        {/* BOX WHATSAPP GATEWAY GRATIS */}
        <div className="bg-[#161925] border border-slate-800 p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">🤖 WhatsApp Web JS API</h2>
            <p className="text-[10px] text-slate-400 mt-1">Status: 
              <span className={`ml-1 font-bold ${waStatus === 'Connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {waStatus}
              </span>
            </p>
          </div>

          {/* Kondisi Rendering Gambar QR Code */}
          {waStatus === 'Waiting Scan QR' && qrImg ? (
            <div className="bg-white p-2 rounded-lg shadow-xl">
              <img src={qrImg} alt="Scan WhatsApp QR" className="w-40 h-40" />
              <p className="text-[9px] text-slate-800 font-medium mt-1">Buka WA &gt; Perangkat Tautkan</p>
            </div>
          ) : waStatus === 'Connected' ? (
            <div className="text-emerald-400 text-3xl">✅</div>
          ) : (
            <div className="w-40 h-40 bg-[#0F111A] border border-slate-800 border-dashed rounded-lg flex items-center justify-center text-[10px] text-slate-500">
              Menginisialisasi Engine...
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed px-2">
            Metode ini memanfaatkan WhatsApp Web tiruan di server Railway. Tidak memerlukan token berbayar dari pihak ketiga.
          </p>
        </div>
      </div>
    </div>
  );
}
