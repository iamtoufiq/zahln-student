import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useT } from "@/hooks/use-t";
import { Button, COLORS, RADIUS, SPACE, TAP_MIN, TYPE } from "@/ui";

import { usePinSheet } from "./use-pin-sheet";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

type Props = { visible: boolean; onSuccess: () => void; onCancel: () => void };

export function PinSheet({ visible, onSuccess, onCancel }: Props) {
  const { t } = useT();
  const { title, filled, length, error, press, remove } = usePinSheet(visible, onSuccess);
  const insets = useSafeAreaInsets();
  const sheetStyle = [styles.sheet, { paddingBottom: insets.bottom + SPACE.xl }];
  const dots = Array.from({ length }, (_, i) => (i < filled ? styles.dotFilled : styles.dot));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={sheetStyle}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <View
            style={styles.dots}
            accessible
            accessibilityLabel={t("pin.progress", { count: filled })}
          >
            {dots.map((style, i) => (
              <View key={i} style={style} />
            ))}
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <View style={styles.pad}>
            {KEYS.map((key, i) =>
              key === "" ? (
                <View key={i} style={styles.key} />
              ) : (
                <Pressable
                  key={i}
                  testID={`pin-${key}`}
                  style={styles.key}
                  accessibilityRole="button"
                  accessibilityLabel={
                    key === "del" ? t("pin.delete") : t("pin.digit", { digit: key })
                  }
                  onPress={() => (key === "del" ? remove() : press(key))}
                >
                  <Text style={styles.keyLabel}>{key === "del" ? "⌫" : key}</Text>
                </Pressable>
              ),
            )}
          </View>
          <Button label={t("common.cancel")} variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const DOT = { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: COLORS.primary };

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: COLORS.scrim },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACE.xl,
    gap: SPACE.lg,
  },
  title: { ...TYPE.title, color: COLORS.text, textAlign: "center" },
  dots: { flexDirection: "row", justifyContent: "center", gap: SPACE.lg },
  dot: DOT,
  dotFilled: { ...DOT, backgroundColor: COLORS.primary },
  error: { ...TYPE.body, color: COLORS.danger, textAlign: "center" },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACE.sm,
  },
  key: { width: "31%", minHeight: TAP_MIN + 8, alignItems: "center", justifyContent: "center" },
  keyLabel: { ...TYPE.hero, color: COLORS.text },
});
