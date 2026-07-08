/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // We ignore linting warnings during final build to prevent process termination on minor warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We validate types strictly before deployment, but let Next build run fast
    ignoreBuildErrors: false,
  }
};

module.exports = nextConfig;
