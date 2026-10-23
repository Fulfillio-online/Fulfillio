/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 auto-detects src/app — no extra config needed
  // Add any future config here (e.g., env variables, image domains)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
};

module.exports = nextConfig;
