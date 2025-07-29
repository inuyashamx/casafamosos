import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.lavanguardia.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lacasadelosfamososmexico.tv',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'st1.uvnimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
