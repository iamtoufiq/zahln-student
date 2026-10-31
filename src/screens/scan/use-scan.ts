import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { parseOrderQr } from "@/core";

export function useScan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const handledRef = useRef(false);

  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);

  const open = useCallback(
    (text: string) => {
      const orderId = parseOrderQr(text);
      if (!orderId) return false;
      router.replace(`/pay/${orderId}`);
      return true;
    },
    [router],
  );

  // The camera fires many events for one QR; only the first valid one navigates.
  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      if (handledRef.current) return;
      if (open(data)) handledRef.current = true;
      else setInvalid(true);
    },
    [open],
  );

  const submitCode = useCallback(() => setInvalid(!open(code)), [code, open]);

  return {
    granted: permission?.granted ?? false,
    canAsk: permission?.canAskAgain ?? true,
    requestPermission,
    onScanned,
    code,
    setCode,
    submitCode,
    invalid,
  };
}
