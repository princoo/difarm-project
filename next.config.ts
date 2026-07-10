import type { NextConfig } from 'next';

const apiTraceIncludes = [
  './node_modules/express/**/*',
  './node_modules/express-session/**/*',
  './node_modules/cors/**/*',
  './node_modules/passport/**/*',
  './node_modules/passport-local/**/*',
  './node_modules/morgan/**/*',
  './node_modules/multer/**/*',
  './node_modules/serverless-http/**/*',
  './node_modules/bcryptjs/**/*',
  './node_modules/jsonwebtoken/**/*',
  './node_modules/joi/**/*',
  './node_modules/nodemailer/**/*',
  './node_modules/@prisma/client/**/*',
  './node_modules/.prisma/**/*',
];

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
  // Externalize native/heavy server packages so Node loads them at runtime.
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'express',
    'express-session',
    'cors',
    'passport',
    'passport-local',
    'morgan',
    'multer',
    'serverless-http',
    'bcryptjs',
    'jsonwebtoken',
    'nodemailer',
    'joi',
  ],
  // Ensure Vercel file tracing packs these into the serverless function.
  outputFileTracingIncludes: {
    '/api/v1/[[...path]]': apiTraceIncludes,
    '/api/uploads/[[...path]]': [
      './node_modules/@prisma/client/**/*',
      './node_modules/.prisma/**/*',
    ],
  },
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
