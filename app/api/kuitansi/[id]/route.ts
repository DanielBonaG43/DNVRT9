import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const idTagihan = params.id;

  // 1. Ambil data iuran beserta detail warga
  const { data: iuranData, error } = await supabase
    .from('iuran')
    .select(`
      id, nama_tagihan, bulan, nominal, status, tanggal_bayar,
      profiles (nama, blok_rumah)
    `)
    .eq('id', idTagihan)
    .single();

  if (error || !iuranData || iuranData.status !== 'Lunas') {
    return NextResponse.json({ error: 'Data pembayaran tidak valid atau belum lunas.' }, { status: 400 });
  }

  // @ts-ignore - Handle type profiles jika gabungan relasi dianggap union
  const warga = iuranData.profiles;

  // 2. Generate Dokumen PDF menggunakan jsPDF
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, 105] }); // Ukuran Memo/Kwitansi

  // Desain & Border Kotak Luar
  doc.setDrawColor(30, 41, 59);
  doc.rect(5, 5, 200, 95);

  // Header Kwitansi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KWITANSI PEMBAYARAN WARGA RT', 15, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('De Naila Village, RT 09 / RW 04, Kab. Gresik', 15, 20);
  doc.line(15, 23, 195, 23);

  // Konten Detail Pembayaran
  doc.setFontSize(10);
  doc.text(`Nomor Transaksi  : ${iuranData.id.substring(0, 8).toUpperCase()}`, 15, 32);
  doc.text(`Telah Terima Dari : ${warga?.nama || '-'} (Blok ${warga?.blok_rumah || '-'})`, 15, 40);
  doc.text(`Untuk Pembayaran : ${iuranData.nama_tagihan} (${iuranData.bulan || '-'})`, 15, 48);
  
  // Nominal Besar (Terbilang Box)
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 55, 100, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`RP. ${Number(iuranData.nominal).toLocaleString('id-ID')}`, 20, 62);

  // Status Cap Lunas
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.rect(130, 55, 25, 12);
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(11);
  doc.text('LUNAS', 136, 63);

  // Tanda Tangan Pengurus RT
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const tglBayar = iuranData.tanggal_bayar ? new Date(iuranData.tanggal_bayar).toLocaleDateString('id-ID') : '-';
  doc.text(`Gresik, ${tglBayar}`, 160, 55);
  doc.text('Bendahara RT 09', 160, 60);
  doc.line(160, 78, 190, 78);
  doc.setFontSize(8);
  doc.text('Sistem Aplikasi RT Mandiri', 160, 82);

  // Convert dokumen ke bentuk Buffer Array agar langsung terdownload otomatis di browser warga
  const pdfOutput = doc.output('arraybuffer');

  return new NextResponse(pdfOutput, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Kwitansi_${iuranData.id.substring(0,6)}.pdf`,
    },
  });
}
