import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const HASH_KEY = "pin-hash";
const SALT_KEY = "pin-salt";

const hash = (pin: string, salt: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + ":" + pin);

export const hasPin = async () => (await SecureStore.getItemAsync(HASH_KEY)) !== null;

export async function savePin(pin: string) {
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(SALT_KEY, salt);
  await SecureStore.setItemAsync(HASH_KEY, await hash(pin, salt));
}

export async function verifyPin(pin: string) {
  const [salt, stored] = await Promise.all([
    SecureStore.getItemAsync(SALT_KEY),
    SecureStore.getItemAsync(HASH_KEY),
  ]);
  return salt !== null && stored !== null && (await hash(pin, salt)) === stored;
}
