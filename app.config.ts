import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Zahln",
  slug: "zahln-student",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "zahln",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "de.zahln.student",
    icon: "./assets/expo.icon",
  },
  android: {
    package: "de.zahln.student",
    adaptiveIcon: {
      backgroundColor: "#5F259F",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    [
      "expo-font",
      {
        // Embedded at build time, so text never waits for a font on launch.
        fonts: [
          "./assets/fonts/Inter-Regular.ttf",
          "./assets/fonts/Inter-SemiBold.ttf",
          "./assets/fonts/PlusJakartaSans-SemiBold.ttf",
          "./assets/fonts/PlusJakartaSans-Bold.ttf",
          "./assets/fonts/PlusJakartaSans-ExtraBold.ttf",
        ],
      },
    ],
    "./plugins/with-network-recovery",
    "expo-secure-store",
    [
      "expo-splash-screen",
      { backgroundColor: "#5F259F", image: "./assets/images/splash-icon.png", imageWidth: 76 },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Zahln uses the camera to scan the QR code at the mensa till.",
        recordAudioAndroid: false,
      },
    ],
    ["expo-local-authentication", { faceIDPermission: "Zahln uses Face ID to confirm payments." }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
