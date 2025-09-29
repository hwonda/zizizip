import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // OpenLayers 관련 설정
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(csv|xlsx|xls)$/,
      loader: 'file-loader',
    });
    return config;
  },
};

export default nextConfig;
