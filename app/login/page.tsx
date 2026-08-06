'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validasi Login jika Pengurus/Superadmin masuk menggunakan Email Resmi
      if (username.includes('@')) {
        const { error: authError } = await supabase.auth.signInWithPassword({ 
          email: username, 
          password 
        });
        if (authError) throw new Error(authError.message);
        router.refresh();
        return router.push('/dashboard');
      }

      // 2. Skema Autentikasi untuk Warga
      // Cari profil warga yang memiliki kemiripan nama dan kecocokan blok rumah
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('nama, blok_rumah')
        .ilike('nama', `%${username}%`)
        .eq('blok_rumah', password)
        .maybeSingle();

      if (dbError || !profile) {
        throw new Error('Data login warga tidak ditemukan. Pastikan nama dan blok rumah sesuai.');
      }

      // Format email virtual terstandarisasi untuk login ke modul Supabase Auth
      const virtualEmail = `${profile.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}.${profile.blok_rumah.toLowerCase().replace(/[^a-z0-9]/g, '')}@rt.local`;
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: password // Blok rumah digunakan sebagai password awal
      });

      if (authError) throw new Error('Gagal memverifikasi akun keamanan warga. Hubungi admin.');
      
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F111A] text-white px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-[#161925] rounded-xl border border-gray-800">
        <h2 className="text-xl font-bold mb-1 text-center">Layanan RT Mandiri</h2>
        <p className="text-xs text-gray-400 text-center mb-6">Silakan masuk untuk mengakses dasbor warga</p>
        
        {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 p-3 rounded border border-red-500/20">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1 text-gray-300">Username / Nama Lengkap</label>
          <input type="text" className="w-full p-2.5 bg-[#0F111A] border border-gray-700 rounded text-sm focus:outline-none focus:border-indigo-500 transition" value={username} onChange={e => setUsername(e.target.value)} placeholder="Contoh: Budi Santoso" required />
        </div>
        
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-1 text-gray-300">Password / Blok Rumah</label>
          <input type="password" className="w-full p-2.5 bg-[#0F111A] border border-gray-700 rounded text-sm focus:outline-none focus:border-indigo-500 transition" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contoh: G-12" required />
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white p-2.5 rounded font-semibold text-sm transition">
          {loading ? 'Memproses...' : 'Masuk Dashboard'}
        </button>
      </form>
    </div>
  );
}
