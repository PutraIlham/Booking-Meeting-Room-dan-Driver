/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'bookingsisi.maturino.my.id',
      'localhost',
      'http://20.251.153.107:3001/'
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'http://20.251.153.107:3001/',
        pathname: '/uploads/**',
      },
    ],
  },
};

// Use ES module export syntax since this is a .mjs file
export default nextConfig;