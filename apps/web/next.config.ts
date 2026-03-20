import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@surflow/core', '@surflow/ui', '@surflow/api-client'],
};

export default nextConfig;
