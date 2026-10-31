import * as LocalAuthentication from "expo-local-authentication";

export async function deviceCanAuthenticate(): Promise<boolean> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level !== LocalAuthentication.SecurityLevel.NONE;
}

export async function authenticateWithDevice(promptMessage: string, cancelLabel: string) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    disableDeviceFallback: false,
  });
  return result.success ? "ok" : "cancelled";
}
