import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // OpenLayers 관련 설정
  webpack: (config, { dev }) => {
    config.module.rules.push({
      test: /\.(csv|xlsx|xls)$/,
      loader: 'file-loader',
    });

    // 프로덕션 빌드 시 console 제거
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          ...(config.optimization?.minimizer || []),
        ],
      };

      // Terser 플러그인 찾아서 설정 추가
      const terserPlugin = config.optimization.minimizer.find(
        (plugin: any) => plugin.constructor.name === 'TerserPlugin',
      );

      if (terserPlugin) {
        terserPlugin.options = {
          ...terserPlugin.options,
          terserOptions: {
            ...terserPlugin.options.terserOptions,
            compress: {
              ...terserPlugin.options.terserOptions?.compress,
              drop_console: true, // console.* 제거
              drop_debugger: true, // debugger 제거
            },
          },
        };
      }
    }

    return config;
  },
};

export default nextConfig;
