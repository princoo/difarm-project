import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Keep native / heavy packages out of the webpack bundle on Vercel
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'express',
    'multer',
    'passport',
    'passport-local',
    'express-session',
    'nodemailer',
    'jsonwebtoken',
    'joi',
    'cors',
    'morgan',
  ],
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
