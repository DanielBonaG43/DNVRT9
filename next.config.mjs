/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // KUNCI UTAMA: Beritahu Webpack untuk tidak membundel modul server biner ini
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'whatsapp-web.js': 'commonjs whatsapp-web.js',
      });
    }
    return config;
  },
};

export default nextConfig;
