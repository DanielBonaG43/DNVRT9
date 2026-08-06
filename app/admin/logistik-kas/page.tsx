'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminLogistikKasPage() {
  const supabase = createClientComponentClient();
  
  // State Inventaris
  const [namaBarang, setNamaBarang] = useState('');
  const [stok, setStok] = useState('5');
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  
  // State Kas
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [kasList, setKasList] = useState<any[]>([]);

  const loadData = async () => {
    const { data: listPinjam } = await supabase.from('peminjaman_inventaris').select('*, profiles(nama, blok_rumah), inventaris(nama_barang)').eq('status', 'Pending');
    const { data: listKas } = await supabase.from('pengeluaran_kas').select('*').order('tanggal', { ascending: false });
    
    if (listPinjam) setPeminjaman(listPinjam);
    if (listKas) setKasList(listKas);
  };

  useEffect(() => { loadData(); }, []);

  const handleTambahBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('inventaris').insert({ nama_barang: namaBarang, total_stok: Number(stok), stok_tersedia: Number(stok) });
    alert('Barang inventaris sukses ditambahkan!');
    setNamaBarang('');
  };

  const handleApprovePinjam = async (id: string, barangId: string, jumlah: number) => {
    // Kurangi stok riil inventaris yang tersedia di gudang
    const { data: b } = await supabase.from('inventaris').select('stok_tersedia').eq('id', barangId).single();
    if (b && b.stok_tersedia >= jumlah) {
      await supabase.from('inventaris').update({ stok_tersedia: b.stok_tersedia - jumlah }).eq('id', barangId);
      await supabase.from('peminjaman_inventaris').update({ status: 'Approved' }).eq('id', id);
      alert('Peminjaman disetujui, stok terpotong.');
      loadData();
    } else {
      alert('Stok barang di gudang tidak mencukupi.');
    }
  };

  const handleCatatPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('pengeluaran_kas').insert({ keterangan, nominal: Number(nominal) });
    alert('Log pengeluaran kas RT berhasil dicatat.');
    setKeterangan(''); setNominal('');
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-6 max-w-5xl mx-auto space-y-8">
      {/* SEKSI INVENTARIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleTambahBarang} className="bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Listing Barang Logistik / Inventaris RT</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" placeholder="Nama Barang (Contoh: Tenda Terpal)" value={namaBarang} onChange={e => setNamaBarang(e.target.value)} required />
            </div>
            <div>
              <input type="number" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" placeholder="Stok" value={stok} onChange={e => setStok(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-xs py-2 rounded font-semibold transition">Daftarkan Aset Barang</button>
        </form>

        <div className="bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-3">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Persetujuan Peminjaman Barang</h2>
          {peminjaman.map(p => (
            <div key={p.id} className="bg-[#0F111A] p-3 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-slate-200">{p.inventaris?.nama_barang} ({p.jumlah} Pcs)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Peminjam: {p.profiles?.nama} - Blok {p.profiles?.blok_rumah}</p>
              </div>
              <button onClick={() => handleApprovePinjam(p.id, p.barang_id, p.jumlah)} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] px-2.5 py-1 rounded text-white">Lepas Barang</button>
            </div>
          ))}
        </div>
      </div>

      {/* SEKSI KAS RT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleCatatPengeluaran} className="bg-[#161925] border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pencatatan Nota Pengeluaran Kas RT</h2>
          <div>
            <input type="text" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" placeholder="Keterangan (Contoh: Bayar Listrik Lampu Jalan)" value={keterangan} onChange={e => setKeterangan(e.target.value)} required />
          </div>
          <div>
            <input type="number" className="w-full text-xs p-2 bg-[#0F111A] border border-slate-800 rounded text-slate-300" placeholder="Nominal Nominal Keluar" value={nominal} onChange={e => setNominal(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs py-2 rounded font-semibold transition">Kurangi Saldo & Simpan Nota</button>
        </form>

        <div className="bg-[#161925] border border-slate-800 p-5 rounded-xl overflow-y-auto max-h-56">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Histori Nota Pengeluaran</h2>
          <div className="space-y-2 text-xs">
            {kasList.map(k => (
              <div key={k.id} className="flex justify-between border-b border-slate-800 pb-2">
                <div>
                  <p className="text-slate-300 font-medium">{k.keterangan}</p>
                  <p className="text-[10px] text-slate-500">{k.tanggal}</p>
                </div>
                <p className="font-mono text-red-400 font-bold">- Rp {Number(k.nominal).toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
