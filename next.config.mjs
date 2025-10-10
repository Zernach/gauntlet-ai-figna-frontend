/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-native', 'react-native-web'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'react-native$': 'react-native-web'
    };

    const extensions = config.resolve.extensions ?? [];
    config.resolve.extensions = [
      '.web.ts',
      '.web.tsx',
      '.web.js',
      ...extensions
    ];

    return config;
  }
};

export default nextConfig;
