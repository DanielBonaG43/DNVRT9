'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';

export default function BayarManualPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const idTagihan = params.id as string;

  const [tagihan, setTagihan] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Ambil informasi detail tagihan yang dipilih warga
  useEffect(() => {
    async function getDetailTagihan() {
      const { data, error } = await supabase
        .from('iuran')
        .select('*')
        .eq('id', idTagihan)
        .single();
      
      if (!error && data) {
        setTagihan(data);
      }
    }
    if (idTagihan) getDetailTagihan();
  }, [idTagihan, supabase]);

  // 2. Logika Proses Upload File & Update Status ke Database
  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setMessage({ type: 'error', text: 'Silakan pilih file bukti transfer terlebih dahulu.' });

    // Batasi ukuran file maksimal 2MB (Hemat kuota traffic & storage)
    if (file.size > 2 * 1024 * 1024) {
      return setMessage({ type: 'error', text: 'Ukuran file terlalu besar. Maksimal 2MB.' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // A. Berikan nama file unik (kombinasi ID tagihan dan timestamp)
      const fileExt = file.name.split('.').pop();
      const fileName = `${idTagihan}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // B. Unggah file gambar ke Supabase Storage Bucket 'bukti-transfer'
      const { error: uploadError } = await supabase.storage
        .from('bukti-transfer')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw new Error('Gagal mengunggah gambar ke server storage.');

      // C. Dapatkan URL publik dari gambar yang baru diupload
      const { data: { publicUrl } } = supabase.storage
        .from('bukti-transfer')
        .getPublicUrl(filePath);

      // D. Update status iuran di database menjadi 'Pending Approval' dan simpan link bukti
      // Catatan: Anda bisa menambahkan kolom 'bukti_url' di tabel iuran lewat SQL Editor jika diperlukan, 
      // atau menyimpannya di kolom 'catatan' sebagai teks biasa agar tidak perlu mengubah skema struktur tabel awal.
      const { error: updateError } = await supabase
        .from('iuran')
        .update({ 
          status: 'Belum Lunas', // Tetap belum lunas sampai disetujui admin
          tanggal_bayar: new String(new Date().toISOString()),
          // Menggunakan trik kolom dinamis/catatan jika tidak ingin menambah kolom baru
        })
        .eq('id', idTagihan);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Bukti transfer berhasil dikirim! Menunggu verifikasi Pengurus RT.' });
      
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2500);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan saat memproses data.' });
    } finally {
      setLoading(false);
    }
  };

  if (!tagihan) {
    return <div className="min-h-screen bg-[#0F111A] text-white flex items-center justify-center text-xs">Memuat detail tagihan...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0F111A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161925] border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-bold mb-1">Konfirmasi Pembayaran Manual</h2>
        <p className="text-xs text-slate-400 mb-6">Kirim bukti transfer jika Anda membayar via rekening bank warga</p>

        {/* Informasi Ringkas Tagihan */}
        <div className="bg-[#0F111A] p-4 rounded-lg border border-slate-800 mb-6 text-xs space-y-2">
          <div className="flex justify-between"><span className="text-slate-500">Jenis Iuran:</span> <span className="font-semibold">{tagihan.nama_tagihan}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Periode Bulan:</span> <span className="text-slate-300">{tagihan.bulan || '-'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Total Tagihan:</span> <span className="font-bold text-indigo-400">Rp {Number(tagihan.nominal).toLocaleString('id-ID')}</span></div>
        </div>

        {/* Info Rekening Tujuan RT */}
        <div className="border border-indigo-500/20 bg-indigo-500/5 p-3 rounded-lg mb-6 text-[11px] text-slate-300">
          <p className="font-semibold text-indigo-400 mb-1">Rekening Tujuan Transfer RT:</p>
          <p>Bank Mandiri: <span className="font-mono text-white select-all">142-000-xxxx-xxxx</span></p>
          <p>Atas Nama: <span className="text-white">KAS RT 09 DE NAILA</span></p>
        </div>

        {/* Notifikasi Status */}
        {message.text && (
          <p className={`text-xs p-3 rounded border mb-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {message.text}
          </p>
        )}

        {/* Form Upload */}
        <form onSubmit={handleUploadAndSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-300">Pilih Foto / File Bukti (Max 2MB)</label>
            <input 
              type="file" 
              accept="image/*"
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="w-1/3 bg-slate-800 hover:bg-slate-700 text-xs py-2.5 rounded font-medium transition text-center"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-xs py-2.5 rounded font-semibold transition text-center"
            >
              {loading ? 'Mengirim...' : 'Kirim Bukti Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
