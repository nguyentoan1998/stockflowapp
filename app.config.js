module.exports = {
  expo: {
    name: "StockFlow App",
    slug: "stockflow-app",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    updates: {
    "url": "https://u.expo.dev/27fadefb-6f07-4078-aa73-1e53807a7216"
    },
  runtimeVersion: {
    "policy": "appVersion"
    },
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      }
    },
    web: {},
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      apiKey: process.env.EXPO_PUBLIC_API_KEY,
      eas: {
        "projectId": "27fadefb-6f07-4078-aa73-1e53807a7216"
      }
    }
  }
};
