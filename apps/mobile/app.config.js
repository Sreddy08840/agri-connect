module.exports = {
  expo: {
    name: "AgriConnect Mobile",
    slug: "agri-connect-mobile",
    scheme: "agriconnect",
    version: "1.0.0",
    orientation: "portrait",
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.agri.connect.mobile"
    },
    android: {
      package: "com.agri.connect.mobile"
    },
    web: {
      bundler: "metro"
    },
    extra: {
      // Use your computer's IP address (not localhost) for mobile devices
      // Update this IP if your computer's local IP changes
      apiUrl: process.env.API_URL || "http://192.168.30.223:8080/api",
      router: {
        origin: false
      }
    },
    experiments: {
      typedRoutes: false
    },
    plugins: [
      [
        "expo-router",
        {
          origin: false
        }
      ]
    ]
  }
};
