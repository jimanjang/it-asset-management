/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
    return [
      {
        source: '/api/((?!auth).*)',
        destination: `${backendUrl}/api/:1`,
      },
    ];
  },
};

export default nextConfig;
