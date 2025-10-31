import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido 'output: export' para habilitar API routes server-side
  // Nota: Isso muda a estratégia de deploy de estático para server-side
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi_webp/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
    ],
  },
  trailingSlash: true,
  basePath: '',
};

export default nextConfig;
