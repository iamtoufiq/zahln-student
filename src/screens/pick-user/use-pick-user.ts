import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { type PayerName, useSessionStore } from "@/stores/session-store";

export const PAYERS: PayerName[] = ["student", "staff", "guest"];

export function usePickUser() {
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);

  const [pending, setPending] = useState<PayerName | null>(null);
  const [failed, setFailed] = useState(false);

  const pick = useCallback(
    async (name: PayerName) => {
      setPending(name);
      setFailed(false);
      try {
        await signIn(name);
        router.replace("/home");
      } catch {
        setFailed(true);
      } finally {
        setPending(null);
      }
    },
    [router, signIn],
  );

  return { pending, failed, pick };
}
