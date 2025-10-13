module.exports = {
  expo: {
    name: "Gauntlet AI",
    slug: "gauntlet-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./public/gauntlet-ai.webp",
    userInterfaceStyle: "dark",
    splash: {
      image: "./public/gauntlet-ai.webp",
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
        foregroundImage: "./public/gauntlet-ai.webp",
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
      "expo-build-properties"
    ],
    scheme: "gauntlet-ai",
    experiments: {
      typedRoutes: true
    },
    extra: {
      ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    }
  }
};

