/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle node: protocol imports from @solana/web3.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
    };
    return config;
  },
};

module.exports = nextConfig;
