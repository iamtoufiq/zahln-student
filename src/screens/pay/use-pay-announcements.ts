import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";

import type { MessageKey } from "@/core";
import { useT } from "@/hooks/use-t";

import type { PayState } from "./pay-machine";
import { resultFor } from "./result-for";

const COUNTDOWN_MARKS = new Set([60, 10]);

// Tells screen reader users about state changes they cannot see.
export function usePayAnnouncements(state: PayState, amount: string, seconds: number) {
  const { t } = useT();
  const counting = state.tag === "review";
  // Every result the screen shows is spoken once, including errors and blocks.
  const key: MessageKey | undefined = resultFor(state)?.title;
  const confirmed = state.tag === "confirmed";

  useEffect(() => {
    if (!key) return;
    const detail = confirmed ? " " + amount : "";
    AccessibilityInfo.announceForAccessibility(t(key) + detail);
  }, [key, confirmed, amount, t]);

  useEffect(() => {
    if (counting && COUNTDOWN_MARKS.has(seconds)) {
      AccessibilityInfo.announceForAccessibility(t("pay.expiresIn", { seconds }));
    }
  }, [counting, seconds, t]);
}
