-- 1. TABEL PROFIL WARGA & ADMIN (Gunakan UUID dari Auth Supabase)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nama TEXT NOT NULL,
    blok_rumah TEXT NOT NULL,
    no_whatsapp TEXT NOT NULL,
    role TEXT DEFAULT 'warga' CHECK (role IN ('superadmin', 'admin', 'warga')),
    ttl TEXT,
    jenis_kelamin TEXT,
    anggota_keluarga TEXT, -- Diperbaiki dari 'anggota_kelaruarga'
    pekerjaan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABEL IURAN (Pastikan berelasi tepat ke profiles.id)
CREATE TABLE iuran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    nama_tagihan TEXT NOT NULL,
    jenis_iuran TEXT CHECK (jenis_iuran IN ('wajib', 'biasa', 'insidentil')),
    bulan TEXT, 
    nominal NUMERIC NOT NULL,
    status TEXT DEFAULT 'Belum Lunas' CHECK (status IN ('Lunas', 'Belum Lunas')),
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABEL PENGELUARAN KAS
CREATE TABLE pengeluaran_kas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keterangan TEXT NOT NULL,
    nominal NUMERIC NOT NULL,
    tanggal DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABEL PERSURATAN
CREATE TABLE surat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    jenis_surat TEXT NOT NULL, 
    keperluan TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABEL PENGUMUMAN
CREATE TABLE pengumuman (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    judul TEXT NOT NULL,
    konten_html TEXT NOT NULL, 
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABEL INVENTARIS
CREATE TABLE inventaris (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_barang TEXT NOT NULL,
    total_stok INT NOT NULL,
    stok_tersedia INT NOT NULL
);

-- 7. CONFIG UTILITY SYSTEM
CREATE TABLE sistem_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO sistem_config (key, value) VALUES 
('tarif_iuran_wajib', '50000'),
('id_ketua_rt', ''),
('wa_api_key', ''),
('qris_payload', '')
ON CONFLICT (key) DO NOTHING;
