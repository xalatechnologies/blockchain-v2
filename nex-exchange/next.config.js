/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_NORCHAIN_RPC: process.env.NEXT_PUBLIC_NORCHAIN_RPC || 'https://rpc.norchain.org',
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '65001',
    NEXT_PUBLIC_NEX_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_NEX_ROUTER_ADDRESS || '',
  },
};

module.exports = nextConfig;

