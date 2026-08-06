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
      // 1. Validasi Login jika Superadmin masuk menggunakan Email Resmi
      if (username.includes('@')) {
        const { error: authError } = await supabase.auth.signInWithPassword({ 
          email: username, 
          password 
        });
        if (authError) throw new Error(authError.message);
        router.refresh();
        return router.push('/admin');
      }

      // 2. Login Warga Menggunakan Akun Warga Umum Terpusat
      // Gunakan email virtual warga umum (Contoh: warga@rt09.local) yang didaftarkan sekali di Supabase Auth
      const citizenEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@rt09.local`;
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: citizenEmail,
        password: password // Password warga umum (Minimal 6 karakter, contoh: warga123)
      });

      if (authError) throw new Error('Kredensial login warga salah. Silakan hubungi pengurus RT.');
      
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
      <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-[#161925] rounded-xl border border-gray-800 shadow-2xl">
        <h2 className="text-xl font-bold mb-1 text-center">Layanan RT Mandiri</h2>
        <p className="text-xs text-gray-400 text-center mb-6">Silakan masuk menggunakan akun resmi RT Anda</p>
        
        {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 p-3 rounded border border-red-500/20">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1 text-gray-300">Username / Email Admin</label>
          <input type="text" className="w-full p-2.5 bg-[#0F111A] border border-gray-700 rounded text-sm focus:outline-none focus:border-indigo-500 transition" value={username} onChange={e => setUsername(e.target.value)} placeholder="Contoh: warga / admin@rt.com" required />
        </div>
        
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-1 text-gray-300">Password</label>
          <input type="password" className="w-full p-2.5 bg-[#0F111A] border border-gray-700 rounded text-sm focus:outline-none focus:border-indigo-500 transition" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" required />
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white p-2.5 rounded font-semibold text-sm transition">
          {loading ? 'Memproses...' : 'Masuk Dashboard'}
        </button>
      </form>
    </div>
  );
}
