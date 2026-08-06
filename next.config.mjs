/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Menggunakan format array external string untuk memaksa Webpack mengabaikan modul Node murni
      config.externals = [...(config.externals || []), 'whatsapp-web.js', 'qrcode'];
    }
    return config;
  },
};

export default nextConfig;
