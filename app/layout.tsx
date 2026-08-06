import type { Metadata } from "next";
import "./globals.css"; // Pastikan Anda mengimpor file CSS utama jika ada

export const metadata: Metadata = {
  title: "Aplikasi RT Mandiri",
  description: "Sistem Layanan Finansial & Administrasi Warga Digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#0F111A]">
        {children}
      </body>
    </html>
  );
}
