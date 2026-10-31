import { StyleSheet, Text, View } from "react-native";

import { useT } from "@/hooks/use-t";
import { COLORS, RADIUS, SPACE, TYPE } from "@/ui";

import type { GateState } from "./use-app-gate";

export function GateNotice({ state }: { state: GateState }) {
  const { t } = useT();
  if (state !== "paused" && state !== "update_required") return null;

  const paused = state === "paused";
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <Text style={styles.title}>{t(paused ? "pay.paused" : "pay.update")}</Text>
      <Text style={styles.body}>{t(paused ? "pay.pausedBody" : "pay.updateBody")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: COLORS.warningTint,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    gap: SPACE.xs,
  },
  title: { ...TYPE.heading, color: COLORS.text },
  body: { ...TYPE.body, color: COLORS.text },
});
