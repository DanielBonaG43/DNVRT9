'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminSuratPage() {
  const supabase = createClientComponentClient();
  const [suratList, setSuratList] = useState<any[]>([]);
  const [catatan, setCatatan] = useState<{ [key: string]: string }>({});

  const fetchSurat = async () => {
    const { data } = await supabase.from('surat').select('*, profiles(nama, blok_rumah)').order('created_at', { ascending: false });
    if (data) setSuratList(data);
  };

  useEffect(() => { fetchSurat(); }, []);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const txtCatatan = catatan[id] || '';
    await supabase.from('surat').update({ status, catatan: txtCatatan }).eq('id', id);
    alert(`Berkas surat berhasil di-${status}.`);
    fetchSurat();
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-lg font-bold mb-2">Pusat Administrasi & Persuratan Lingkungan</h1>
      <p className="text-xs text-slate-400 mb-6">Tinjau permohonan surat pengantar, domisili, atau administrasi warga</p>
      
      <div className="bg-[#161925] border border-slate-800 rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-medium">
              <th className="pb-2">Warga</th>
              <th className="pb-2">Jenis Surat</th>
              <th className="pb-2">Keperluan / Alasan Isi</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Tulis Catatan Admin</th>
              <th className="pb-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {suratList.map(s => (
              <tr key={s.id} className="hover:bg-slate-800/10">
                <td className="py-3">
                  <p className="font-semibold">{s.profiles?.nama}</p>
                  <p className="text-[10px] text-slate-500">Blok {s.profiles?.blok_rumah}</p>
                </td>
                <td className="py-3 font-medium text-slate-300">{s.jenis_surat}</td>
                <td className="py-3 text-slate-400 max-w-xs truncate">{s.keperluan}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : s.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{s.status}</span>
                </td>
                <td className="py-3">
                  <input type="text" className="bg-[#0F111A] border border-slate-800 p-1 text-[11px] rounded text-slate-300" placeholder="Contoh: Ambil di pos RT" value={catatan[s.id] || ''} onChange={e => setCatatan({ ...catatan, [s.id]: e.target.value })} />
                </td>
                <td className="py-3 text-right space-x-1">
                  {s.status === 'Pending' && (
                    <>
                      <button onClick={() => handleUpdateStatus(s.id, 'Approved')} className="bg-emerald-600 text-[11px] px-2 py-1 rounded text-white hover:bg-emerald-700">Setujui</button>
                      <button onClick={() => handleUpdateStatus(s.id, 'Rejected')} className="bg-red-600/20 text-[11px] px-2 py-1 rounded text-red-400 hover:bg-red-600 hover:text-white">Tolak</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
