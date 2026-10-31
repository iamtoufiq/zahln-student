import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { useT } from "@/hooks/use-t";

import { hasPin, savePin, verifyPin } from "../pin-store";

const PIN_LENGTH = 4;

type Step = "loading" | "create" | "repeat" | "enter";

export function usePinSheet(visible: boolean, onSuccess: () => void) {
  const { t } = useT();

  const [step, setStep] = useState<Step>("loading");
  const [digits, setDigits] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(
    async (pin: string) => {
      setDigits("");
      if (step === "create") {
        setFirstPin(pin);
        setStep("repeat");
        return;
      }
      if (step === "repeat") {
        if (pin !== firstPin) {
          setError(t("pin.mismatch"));
          setStep("create");
          return;
        }
        await savePin(pin);
        return onSuccess();
      }
      if (await verifyPin(pin)) return onSuccess();
      setError(t("pin.wrong"));
    },
    [firstPin, onSuccess, step, t],
  );

  const press = useCallback(
    (digit: string) => {
      setError(null);
      const next = (digits + digit).slice(0, PIN_LENGTH);
      setDigits(next);
      AccessibilityInfo.announceForAccessibility(t("pin.progress", { count: next.length }));
      if (next.length === PIN_LENGTH) void finish(next);
    },
    [digits, finish, t],
  );

  const remove = useCallback(() => setDigits((d) => d.slice(0, -1)), []);

  useEffect(() => {
    if (!visible) return;
    setStep("loading");
    setDigits("");
    setError(null);
    void hasPin().then((exists) => setStep(exists ? "enter" : "create"));
  }, [visible]);

  const title = step === "loading" ? "" : t(`pin.${step}`);

  return { title, filled: digits.length, length: PIN_LENGTH, error, press, remove };
}
