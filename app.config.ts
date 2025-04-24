export default {
  expo: {
    name: "App",
    slug: "app",
    version: "1.0.0",
    scheme: "myapp",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.app",
      config: {
        googleMapsApiKey: process.env.YOUR_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourcompany.app",
      config: {
        googleMaps: {
          apiKey: process.env.YOUR_GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      versionCode: 1,
      softwareKeyboardLayoutMode: "pan"
    },
    plugins: [
      ["expo-location", {
        locationAlwaysAndWhenInUsePermission: "Allow App to use your location."
      }],
      "expo-router",
      "expo-video"
    ],
    extra: {
      SUPABASE_URL: process.env.database_url,
      SUPABASE_ANON_KEY: process.env.database_key,
      YOUR_GOOGLE_MAPS_API_KEY: process.env.YOUR_GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: "135163b9-b508-40f4-a681-81def5b4c6e4"
      }
    }
  }
};