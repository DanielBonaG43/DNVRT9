'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminWargaPage() {
  const supabase = createClientComponentClient();
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [nama, setNama] = useState('');
  const [blok, setBlok] = useState('');
  const [wa, setWa] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWarga = async () => {
    // Menampilkan seluruh daftar profil yang terdaftar sebagai warga di database
    const { data } = await supabase.from('profiles').select('*').eq('role', 'warga').order('created_at', { ascending: false });
    if (data) setWargaList(data);
  };

  useEffect(() => { fetchWarga(); }, []);

  const handleTambahWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Menyisipkan data warga langsung ke dalam tabel profiles tanpa mendaftarkan user auth baru
      const { error } = await supabase.from('profiles').insert({
        id: gen_random_uuid_local(), // Menggunakan id acak lokal untuk pencatatan
        nama,
        blok_rumah: blok,
        no_whatsapp: wa,
        role: 'warga'
      });

      if (error) throw error;

      alert('Data warga berhasil dicatat ke dalam sistem!');
      setNama(''); setBlok(''); setWa('');
      fetchWarga();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally { setLoading(false); }
  };

  // Fungsi pembentuk string ID acak lokal agar tidak bentrok di database
  const gen_random_uuid_local = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleHapusWarga = async (id: string) => {
    if (!confirm('Hapus pencatatan data warga ini?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setWargaList(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-lg font-bold mb-6">Buku Induk Pencatatan Data Warga</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input Data Dasar */}
        <form onSubmit={handleTambahWarga} className="bg-[#161925] border border-slate-800 p-5 rounded-xl h-fit space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Input Biodata Warga</h2>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Nama Lengkap</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={nama} onChange={e => setNama(e.target.value)} placeholder="Budi Santoso" required />
          </div>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Blok Rumah</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={blok} onChange={e => setBlok(e.target.value)} placeholder="G-12" required />
          </div>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">No. WhatsApp Aktif</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={wa} onChange={e => setWa(e.target.value)} placeholder="62812345678" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-xs py-2 rounded font-semibold hover:bg-indigo-700 transition">
            {loading ? 'Menyimpan...' : 'Simpan Pencatatan Warga'}
          </button>
        </form>

        {/* Tabel Daftar Warga */}
        <div className="lg:col-span-2 bg-[#161925] border border-slate-800 p-5 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-medium">
                <th className="pb-2">Nama Warga</th>
                <th className="pb-2">Blok Rumah</th>
                <th className="pb-2">No. WhatsApp</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {wargaList.map(w => (
                <tr key={w.id} className="hover:bg-slate-800/10">
                  <td className="py-2.5 font-medium">{w.nama}</td>
                  <td className="py-2.5 text-slate-400">{w.blok_rumah}</td>
                  <td className="py-2.5 text-slate-400">{w.no_whatsapp}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => handleHapusWarga(w.id)} className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded hover:bg-red-500 hover:text-white transition">Hapus</button>
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
