'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari aplikasi warga?')) return;
    setLoading(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-xs bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-400 hover:text-white px-3 py-1.5 rounded transition font-medium disabled:opacity-50"
    >
      {loading ? 'Keluar...' : '🚪 Keluar Akun'}
    </button>
  );
}
