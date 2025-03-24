/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "https://web-production-06c8c.up.railway.app/api/:path*",
        },
      ]
    },
  }
  
  module.exports = nextConfig
  
  