import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { intents } from "@/lib/intents";

import { useAppGate } from "@/screens/gate/use-app-gate";
import { useLocaleStore } from "@/stores/locale-store";
import { useSessionStore } from "@/stores/session-store";

let resumeChecked = false;

export function useHome() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const savedUsername = useSessionStore((s) => s.savedUsername);
  const signOut = useSessionStore((s) => s.signOut);
  const toggleLocale = useLocaleStore((s) => s.toggle);
  const { state: gate } = useAppGate();

  const canPay = gate !== "paused" && gate !== "update_required";
  const [openOrderId, setOpenOrderId] = useState<string>();

  // A payment whose outcome is not known yet stays visible, so it is never forgotten.
  useFocusEffect(
    useCallback(() => {
      setOpenOrderId(savedUsername ? intents.live(savedUsername)[0]?.orderId : undefined);
    }, [savedUsername]),
  );
  const openPayment = useCallback(() => {
    if (openOrderId) router.push(`/pay/${openOrderId}`);
  }, [openOrderId, router]);

  const scan = useCallback(() => router.push("/scan"), [router]);
  const history = useCallback(() => router.push("/history"), [router]);
  const openDevFaults = useCallback(() => {
    if (__DEV__) router.push("/dev-faults");
  }, [router]);
  const switchUser = useCallback(() => {
    signOut();
    router.replace("/");
  }, [router, signOut]);

  // A payment left open by a crash or a kill is resumed once, when the app starts.
  useEffect(() => {
    if (resumeChecked || !savedUsername) return;
    resumeChecked = true;
    const open = intents.live(savedUsername)[0];
    if (open) router.push(`/pay/${open.orderId}`);
  }, [router, savedUsername]);

  return {
    user,
    gate,
    canPay,
    openOrderId,
    openPayment,
    scan,
    history,
    openDevFaults,
    switchUser,
    toggleLocale,
  };
}
