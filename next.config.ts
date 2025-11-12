import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 프로덕션 빌드에서 console 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

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
