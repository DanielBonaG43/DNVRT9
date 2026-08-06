
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Mengarahkan warga atau admin secara otomatis dari halaman utama (/) ke halaman (/login)
  redirect('/login');
}
