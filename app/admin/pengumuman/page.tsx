'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminPengumumanPage() {
  const supabase = createClientComponentClient();
  const [judul, setJudul] = useState('');
  const [htmlKonten, setHtmlKonten] = useState('');
  const [listPending, setListPending] = useState<any[]>([]);

  const fetchPendingPengumuman = async () => {
    const { data } = await supabase.from('pengumuman').select('*, profiles(nama)').eq('status', 'Pending');
    if (data) setListPending(data);
  };

  useEffect(() => { fetchPendingPengumuman(); }, []);

  const handleBuatPengumumanRT = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (new Blob([htmlKonten]).size > 1000 * 1024) {
      return alert('Ukuran konten teks HTML melebihi batas maksimal 1000KB.');
    }

    await supabase.from('pengumuman').insert({
      user_id: user.id,
      judul,
      konten_html: htmlKonten,
      status: 'Approved' // Akun admin otomatis berstatus disetujui
    });

    alert('Pengumuman resmi pengurus berhasil ditayangkan di dashboard warga.');
    setJudul(''); setHtmlKonten('');
  };

  const handleApproveWarga = async (id: string) => {
    await supabase.from('pengumuman').update({ status: 'Approved' }).eq('id', id);
    setListPending(prev => prev.filter(item => item.id !== id));
    alert('Pengumuman usulan warga disetujui.');
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Pembuat */}
        <form onSubmit={handleBuatPengumumanRT} className="bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tulis Pengumuman Resmi Pengurus</h2>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Judul Informasi</label>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" value={judul} onChange={e => setJudul(e.target.value)} placeholder="Contoh: Kerja Bakti Massal RT 09" required />
          </div>
          <div>
            <label className="block text-[11px] mb-1 text-slate-400">Konten Pengumuman (Mendukung Struktur Tag HTML Mini)</label>
            <textarea className="w-full h-40 text-xs p-2 bg-[#0F111A] border border-slate-800 rounded font-mono text-emerald-400" value={htmlKonten} onChange={e => setHtmlKonten(e.target.value)} placeholder="Contoh: Jam <b>07:00</b> di lapangan.<br/>Bawa cangkul." required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-xs py-2 rounded font-semibold hover:bg-indigo-700 transition">Tayangkan Sekarang</button>
        </form>

        {/* List Usulan Warga */}
        <div className="bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Usulan Pengumuman Warga (Menunggu Approval)</h2>
          <div className="space-y-3">
            {listPending.length === 0 ? (
              <p className="text-xs text-slate-500">Tidak ada ajuan pengumuman dari warga.</p>
            ) : (
              listPending.map(p => (
                <div key={p.id} className="bg-[#0F111A] p-3 border border-slate-800 rounded-lg flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">{p.judul}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Diusulkan oleh: {p.profiles?.nama}</p>
                  </div>
                  <button onClick={() => handleApproveWarga(p.id)} className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-2.5 py-1 rounded text-white">Approve</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
