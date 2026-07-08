/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  experimental: { serverComponentsExternalPackages: ['sharp', '@prisma/client', 'prisma'] },
}

export default config
