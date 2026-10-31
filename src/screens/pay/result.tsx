import { type ComponentRef, useEffect, useRef } from "react";
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { MessageKey } from "@/core";
import { useT } from "@/hooks/use-t";
import { Button, COLORS, RADIUS, SPACE, TYPE } from "@/ui";

import { SuccessPop } from "./success-pop";

export type ResultTone = "success" | "pending" | "danger" | "neutral";

type Props = {
  tone: ResultTone;
  title: MessageKey;
  body?: string;
  action?: { label: string; onPress: () => void; testID: string };
  onDone: () => void;
};

const BADGE: Record<ResultTone, { fill: string; mark: string }> = {
  success: { fill: COLORS.success, mark: "✓" },
  pending: { fill: COLORS.primary, mark: "" },
  danger: { fill: COLORS.danger, mark: "!" },
  neutral: { fill: COLORS.muted, mark: "i" },
};

export function Result({ tone, title, body, action, onDone }: Props) {
  const { t } = useT();
  const badgeStyle = [styles.badge, { backgroundColor: BADGE[tone].fill }];
  const titleRef = useRef<ComponentRef<typeof Text>>(null);

  // Screen reader focus follows the result, so the next swipe reads it and not the old screen.
  useEffect(() => {
    if (titleRef.current) AccessibilityInfo.sendAccessibilityEvent(titleRef.current, "focus");
  }, [title]);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <SuccessPop play={tone === "success"}>
          <View style={badgeStyle} importantForAccessibility="no-hide-descendants">
            {tone === "pending" ? (
              <ActivityIndicator color={COLORS.onPrimary} size="large" />
            ) : (
              <Text style={styles.mark}>{BADGE[tone].mark}</Text>
            )}
          </View>
        </SuccessPop>
        <Text
          ref={titleRef}
          testID="pay-result-title"
          accessibilityRole="header"
          style={styles.title}
        >
          {t(title)}
        </Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
      {action ? (
        <Button testID={action.testID} label={action.label} onPress={action.onPress} />
      ) : null}
      <Button testID="pay-done" label={t("common.done")} variant="secondary" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: SPACE.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACE.lg },
  badge: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: { fontSize: 48, fontWeight: "800", color: COLORS.onPrimary },
  title: { ...TYPE.hero, color: COLORS.text, textAlign: "center" },
  body: { ...TYPE.body, color: COLORS.muted, textAlign: "center" },
});
