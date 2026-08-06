import "./globals.css"; // WAJIB DI BARIS PERTAMA
import type { Metadata } from "next";

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
