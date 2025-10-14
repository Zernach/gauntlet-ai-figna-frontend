require('dotenv').config();

module.exports = {
  expo: {
    name: "Gauntlet AI",
    slug: "gauntlet-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./public/gauntlet-ai.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./public/gauntlet-ai.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.archlife.gauntletai"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./public/gauntlet-ai.png",
        backgroundColor: "#000000"
      },
      package: "com.archlife.gauntletai"
    },
    web: {
      favicon: "./public/favicon.ico",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-build-properties",
      "expo-dev-client"
    ],
    scheme: "gauntlet-ai",
    experiments: {
      typedRoutes: true
    },
    extra: {
      ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    }
  }
};

