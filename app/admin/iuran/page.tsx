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
      // PERBAIKAN UTAMA: Tarik semua ID warga dari tabel baru 'akun_warga' (bukan tabel profiles lagi)
      const { data: warga, error: fetchError } = await supabase
        .from('akun_warga')
        .select('id');
        
      if (fetchError) throw fetchError;
      if (!warga || warga.length === 0) throw new Error('Tidak ada warga terdaftar untuk ditagih. Silakan input warga baru terlebih dahulu.');

      // Buat bulk objek array iuran massal
      const bulkTagihan = warga.map(w => ({
        user_id: w.id, // ID merujuk privat ke akun_warga.id
        nama_tagihan: namaTagihan,
        jenis_iuran: jenis,
        bulan: jenis === 'wajib' ? bulan : null,
        nominal: Number(nominal),
        status: 'Belum Lunas'
      }));

      const { error: insertError } = await supabase.from('iuran').insert(bulkTagihan);
      if (insertError) throw insertError;

      alert(`Sukses menerbitkan ${bulkTagihan.length} invoice tagihan baru ke seluruh warga.`);
      setNamaTagihan('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 flex items-center justify-center">
      <form onSubmit={handleGenerateIuran} className="w-full max-w-md bg-[#161925] border border-slate-800 p-6 rounded-xl space-y-4 shadow-2xl">
        <div>
          <h1 className="text-base font-bold text-slate-200">Penerbit Invoice Iuran Otomatis</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Sistem akan menyebarkan tagihan secara massal berdasarkan daftar akun warga terpusat</p>
        </div>
        
        <div>
          <label className="block text-[11px] mb-1 text-slate-400">Jenis Ketetapan Iuran</label>
          <select className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={jenis} onChange={e => setJenis(e.target.value as any)}>
            <option value="wajib">Iuran Wajib Bulanan</option>
            <option value="biasa">Iuran Biasa / Sukarela</option>
            <option value="insidentil">Iuran Insidentil / Darurat Lingkungan</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[11px] mb-1 text-slate-400">Nama Dokumen / Keterangan Tagihan</label>
          <input type="text" className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={namaTagihan} onChange={e => setNamaTagihan(e.target.value)} placeholder="Contoh: Iuran Sampah & Kematian" required />
        </div>
        
        {jenis === 'wajib' && (
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Periode Bulan Tagihan</label>
            <input type="text" className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={bulan} onChange={e => setBulan(e.target.value)} placeholder="Contoh: Mei 2026" required />
          </div>
        )}
        
        <div>
          <label className="block text-[11px] mb-1 text-slate-400">Nominal Tagihan (Rupiah)</label>
          <input type="number" className="w-full text-xs p-2.5 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500 font-mono" value={nominal} onChange={e => setNominal(e.target.value)} required />
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs py-2.5 rounded font-semibold transition mt-2 shadow-lg shadow-indigo-600/10">
          {loading ? 'Mengeksekusi Distribusi Data...' : 'Terbitkan & Kirim Invoice Massal'}
        </button>
      </form>
    </div>
  );
}
