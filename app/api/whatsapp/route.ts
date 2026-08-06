export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

// Variabel global untuk menyimpan sesi WhatsApp agar tidak terputus saat pindah halaman
let client: Client | null = null;
let qrCodeText = '';
let statusConnected = 'Disconnected';

export async function GET() {
  // Jika client belum diinisialisasi, buat koneksi baru
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth(), // Menyimpan sesi login otomatis di folder lokal agar tidak perlu scan ulang
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Wajib untuk server cloud seperti Railway
      }
    });

    client.on('qr', (qr) => {
      qrCodeText = qr;
      statusConnected = 'Waiting Scan QR';
      console.log('QR RECEIVED', qr);
    });

    client.on('ready', () => {
      statusConnected = 'Connected';
      qrCodeText = '';
      console.log('Client is ready!');
    });

    client.on('disconnected', () => {
      statusConnected = 'Disconnected';
      client = null;
    });

    client.initialize();
  }

  // Jika status sedang menunggu scan, konversi string QR menjadi gambar Base64 agar bisa ditampilkan di UI
  let qrImageBase64 = '';
  if (qrCodeText) {
    qrImageBase64 = await qrcode.toDataURL(qrCodeText);
  }

  return NextResponse.json({
    status: statusConnected,
    qrImage: qrImageBase64
  });
}

// ENDPOINT UNTUK MENGIRIM PESAN OTOMATIS
export async function POST(request: Request) {
  if (statusConnected !== 'Connected' || !client) {
    return NextResponse.json({ error: 'WhatsApp API belum terhubung. Silakan scan QR terlebih dahulu.' }, { status: 400 });
  }

  try {
    const { to, message } = await request.json();
    
    // Format nomor HP warga agar sesuai standar WhatsApp (Contoh: 628123xxx@c.us)
    const formattedNumber = `${to.replace(/[^0-9]/g, '')}@c.us`;
    
    await client.sendMessage(formattedNumber, message);
    
    return NextResponse.json({ success: true, message: 'Pesan pengingat berhasil dikirim!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
