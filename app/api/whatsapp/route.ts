export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Penampung status global engine di memori server
let client: any = null;
let qrCodeText = '';
let statusConnected = 'Disconnected';

export async function GET() {
  if (!client) {
    try {
      // TRIK PAMUNGKAS: Gunakan eval require agar Webpack Next.js tidak mendeteksi teks impor secara statis
      const dynamicRequire = eval('require');
      const { Client, LocalAuth } = dynamicRequire('whatsapp-web.js');

      client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--single-process'
          ],
        }
      });

      client.on('qr', (qr: string) => {
        qrCodeText = qr;
        statusConnected = 'Waiting Scan QR';
        console.log('QR RECEIVED', qr);
      });

      client.on('ready', () => {
        statusConnected = 'Connected';
        qrCodeText = '';
        console.log('WhatsApp Engine Live!');
      });

      client.on('disconnected', () => {
        statusConnected = 'Disconnected';
        client = null;
        qrCodeText = '';
      });

      client.initialize().catch((err: any) => {
        console.error('Inisialisasi Gagal:', err);
        client = null;
      });
    } catch (err: any) {
      return NextResponse.json({ status: 'Engine Offline', error: err.message });
    }
  }

  // Mengubah string QR menjadi Base64 menggunakan qrcode dinamis
  let qrImageBase64 = '';
  if (qrCodeText) {
    try {
      const dynamicRequire = eval('require');
      const qrcode = dynamicRequire('qrcode');
      qrImageBase64 = await qrcode.toDataURL(qrCodeText);
    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.json({
    status: statusConnected,
    qrImage: qrImageBase64
  });
}

export async function POST(request: Request) {
  if (statusConnected !== 'Connected' || !client) {
    return NextResponse.json({ error: 'WhatsApp belum terhubung.' }, { status: 400 });
  }

  try {
    const { to, message } = await request.json();
    const formattedNumber = `${to.replace(/[^0-9]/g, '')}@c.us`;
    await client.sendMessage(formattedNumber, message);
    return NextResponse.json({ success: true, message: 'Notifikasi terkirim.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
