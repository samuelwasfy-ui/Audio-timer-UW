import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "BHVD",
  slug: "bhvd",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#09090b"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.bhvd.app",
    associatedDomains: [
      "applinks:bhvd.app"
    ],
    infoPlist: {
      UIBackgroundModes: ["audio"],
      NFCReaderUsageDescription: "BHVD uses NFC to instantly start your deep focus sessions."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#09090b"
    },
    package: "com.bhvd.app",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "bhvd.app",
            pathPrefix: "/session"
          },
          {
            scheme: "bhvd",
            host: "session"
          }
        ],
        category: [
          "BROWSABLE",
          "DEFAULT"
        ]
      }
    ]
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro"
  },
  plugins: [
    "expo-font",
    "expo-av"
  ],
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    eas: {
      projectId: "your-project-id-here"
    }
  }
});