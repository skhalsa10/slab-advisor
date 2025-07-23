import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'syoxdgxffdvvpguzvcxo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.tcgdex.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
