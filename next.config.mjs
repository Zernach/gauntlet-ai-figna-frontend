/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'react-native',
    'react-native-web',
    'expo',
    'expo-modules-core',
    'expo-crypto',
  ],
  webpack: (config, { webpack }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'react-native$': 'react-native-web',
    };

    const extensions = config.resolve.extensions ?? [];
    config.resolve.extensions = [
      '.web.ts',
      '.web.tsx',
      '.web.js',
      ...extensions,
    ];

    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(process.env.ENVIRONMENT !== 'prod'),
        'process.env.EXPO_OS': JSON.stringify('web'),
      }),
    );

    return config;
  },
};

export default nextConfig;
