'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminIuranPage() {
  const supabase = createClientComponentClient();
  const [namaTagihan, setNamaTagihan] = useState('');
  const [bulan, setBulan] = useState('Januari 2026');
  const [nominal, setNominal] = useState('50000');
  const [jenis, setJenis] = useState<'wajib' | 'biasa' | 'insidentil'>('wajib');
  const [loading, setLoading] = useState(false);

  const handleGenerateIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Terbitkan tagihan ${namaTagihan} sebesar Rp ${Number(nominal).toLocaleString('id-ID')} ke SEMUA warga terdaftar?`)) return;
    
    setLoading(true);
    try {
      // 1. Tarik semua ID warga terdaftar
      const { data: warga } = await supabase.from('profiles').select('id').eq('role', 'warga');
      if (!warga || warga.length === 0) throw new Error('Tidak ada warga terdaftar untuk ditagih.');

      // 2. Buat bulk objek array untuk disisipkan massal
      const bulkTagihan = warga.map(w => ({
        user_id: w.id,
        nama_tagihan: namaTagihan,
        jenis_iuran: jenis,
        bulan: jenis === 'wajib' ? bulan : null,
        nominal: Number(nominal),
        status: 'Belum Lunas'
      }));

      const { error } = await supabase.from('iuran').insert(bulkTagihan);
      if (error) throw error;

      alert(`Sukses menerbitkan ${bulkTagihan.length} invoice tagihan baru.`);
      setNamaTagihan('');
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-md mx-auto flex items-center justify-center">
      <form onSubmit={handleGenerateIuran} className="w-full bg-[#161925] border border-slate-800 p-6 rounded-xl space-y-4">
        <div>
          <h1 className="text-base font-bold">Penerbit Invoice Iuran Otomatis</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Sistem akan menyebarkan tagihan secara massal ke seluruh warga</p>
        </div>
        <div>
          <label className="block text-[11px] mb-1 text-slate-400">Jenis Ketetapan Iuran</label>
          <select className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none" value={jenis} onChange={e => setJenis(e.target.value as any)}>
            <option value="wajib">Iuran Wajib Bulanan (Ada Pengingat WA)</option>
            <option value="biasa">Iuran Biasa / Sukarela</option>
            <option value="insidentil">Iuran Insidentil / Darurat Lingkungan</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] mb-1 text-slate-400">Nama Dokumen / Keterangan Tagihan</label>
          <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" value={namaTagihan} onChange={e => setNamaTagihan(e.target.value)} placeholder="Contoh: Iuran Kebersihan & Keamanan" required />
        </div>
        {jenis === 'wajib' && (
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Periode Bulan Tagihan</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" value={bulan} onChange={e => setBulan(e.target.value)} placeholder="Contoh: Mei 2026" required />
          </div>
        )}
        <div>
          <label className="block text-[11px] mb-1 text-slate-400">Nominal Tagihan (Rupiah)</label>
          <input type="number" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" value={nominal} onChange={e => setNominal(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs py-2.5 rounded font-semibold transition">
          {loading ? 'Mengeksekusi Distribusi Data...' : 'Terbitkan & Kirim Invoice Massal'}
        </button>
      </form>
    </div>
  );
}
