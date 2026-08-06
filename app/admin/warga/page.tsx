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
    const { data } = await supabase.from('profiles').select('*').eq('role', 'warga').order('created_at', { ascending: false });
    if (data) setWargaList(data);
  };

  useEffect(() => { fetchWarga(); }, []);

  const handleTambahWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Trik bypass register: Warga didaftarkan oleh admin di tabel profiles. 
      // Supabase membutuhkan UUID auth.users asli jika ingin integrasi penuh. Untuk mempermudah sistem pendaftaran langsung tanpa konfirmasi email:
      // Kita panggil Edge Function atau bypass sign-up terselubung menggunakan format kredensial default.
      const virtualEmail = `${nama.toLowerCase().replace(/[^a-z0-9]/g, '')}.${blok.toLowerCase().replace(/[^a-z0-9]/g, '')}@rt.local`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: blok, // Password default adalah blok rumah sesuai permintaan
        options: { data: { nama, blok_rumah: blok, no_whatsapp: wa } }
      });

      if (authError) throw authError;

      // Masukkan profil manual jika trigger trigger otomatis db Supabase belum terpasang
      if (authData.user) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          nama,
          blok_rumah: blok,
          no_whatsapp: wa,
          role: 'warga'
        });
      }

      alert('Warga berhasil didaftarkan ke sistem!');
      setNama(''); setBlok(''); setWa('');
      fetchWarga();
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const handleHapusWarga = async (id: string) => {
    if (!confirm('Hapus warga ini? Seluruh data iuran terikat akan ikut terhapus otomatis.')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setWargaList(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-lg font-bold mb-6">Manajemen Data Dasar Warga</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Form Input */}
        <form onSubmit={handleTambahWarga} className="bg-[#161925] border border-slate-800 p-5 rounded-xl h-fit space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Input Warga Baru</h2>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Nama Lengkap</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={nama} onChange={e => setNama(e.target.value)} placeholder="Budi Santoso" required />
          </div>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Blok Rumah (Akan jadi Password)</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={blok} onChange={e => setBlok(e.target.value)} placeholder="G-12" required />
          </div>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">No. WhatsApp aktif (Format 62)</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-indigo-500" value={wa} onChange={e => setWa(e.target.value)} placeholder="62812345678" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-xs py-2 rounded font-semibold hover:bg-indigo-700 transition">
            {loading ? 'Memproses...' : 'Daftarkan Akun Warga'}
          </button>
        </form>

        {/* Tabel List Warga */}
        <div className="lg:col-span-2 bg-[#161925] border border-slate-800 p-5 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-medium">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Blok</th>
                <th className="pb-2">No. WA</th>
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
