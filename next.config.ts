import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  /* konfigurasie opsies hier */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Deaktiveer Next.js warm herlaai, nodemon hanteer hersamestelling
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Deaktiveer webpack se warm module vervanging
      config.watchOptions = {
        ignored: ['**/*'], // Ignoreer alle lêer veranderinge
      };
    }
    return config;
  },
  eslint: {
    // Ignoreer ESLint foute tydens bou
    ignoreDuringBuilds: true,
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Deaktiveer PWA in ontwikkeling
})(nextConfig);

export default pwaConfig;
