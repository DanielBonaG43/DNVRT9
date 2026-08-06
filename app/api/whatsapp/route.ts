export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

let client: any = null;
let qrCodeText = '';
let statusConnected = 'Disconnected';

export async function GET() {
  const dynamicRequire = eval('require');
  const { Client, LocalAuth } = dynamicRequire('whatsapp-web.js');

  // Menggunakan executable path dinamis dari environment variable Railway
  // Ganti baris penentuan chromePath Anda menjadi kode super-aman berikut:
const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';


  if (!client) {
    statusConnected = 'Initializing...';
    try {
      client = new Client({
        authStrategy: new LocalAuth({ clientId: "rt09-session" }),
        puppeteer: {
          headless: true,
          executablePath: chromePath, // Memaksa pemanggilan biner local server
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
          ],
        }
      });

      client.on('qr', (qr: string) => {
        qrCodeText = qr;
        statusConnected = 'Waiting Scan QR';
        console.log('QR CODE TERSEDIA DI SERVER');
      });

      client.on('ready', () => {
        statusConnected = 'Connected';
        qrCodeText = '';
      });

      client.on('disconnected', () => {
        statusConnected = 'Disconnected';
        client = null;
        qrCodeText = '';
      });

      // Jalankan inisialisasi secara background tanpa mengunci thread utama API Next.js
      client.initialize().catch((e: any) => {
        console.error(e);
        statusConnected = 'Engine Offline';
        client = null;
      });

    } catch (err: any) {
      statusConnected = 'Engine Offline';
      client = null;
    }
  }

  // Generate QR Code ke bentuk Base64 jika string teks sudah dipancarkan oleh engine
  let qrImageBase64 = '';
  if (qrCodeText) {
    try {
      const qrcode = dynamicRequire('qrcode');
      qrImageBase64 = await qrcode.toDataURL(qrCodeText);
      statusConnected = 'Waiting Scan QR'; // Paksa status berubah di UI
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
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
