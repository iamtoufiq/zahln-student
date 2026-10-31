import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Payment } from "@/api/payments/interface";
import { formatCents, formatDateTime } from "@/core";
import { useT } from "@/hooks/use-t";
import { COLORS, SPACE, StatusBadge, TYPE } from "@/ui";

import { toneFor } from "./status-tone";

export const ROW_HEIGHT = 72;

type Props = { payment: Payment; onPress: (id: string) => void };

export const PaymentRow = memo(function PaymentRow({ payment, onPress }: Props) {
  const { t, locale } = useT();
  const amount = formatCents(payment.amountCents, locale);
  const status = t(`status.${payment.status}`);
  const date = formatDateTime(payment.createdAt, locale);

  return (
    <Pressable
      testID={`payment-${payment.id}`}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${payment.mensa.name}, ${amount}, ${status}, ${date}`}
      onPress={() => onPress(payment.id)}
    >
      <View style={styles.main}>
        <Text style={styles.mensa} numberOfLines={1}>
          {payment.mensa.name}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.side}>
        <Text style={styles.amount}>{amount}</Text>
        <StatusBadge tone={toneFor(payment.status)} label={status} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: SPACE.md,
  },
  main: { flex: 1, gap: 2 },
  side: { alignItems: "flex-end", gap: 4 },
  mensa: { ...TYPE.bodyStrong, color: COLORS.text },
  date: { ...TYPE.caption, color: COLORS.muted },
  amount: { ...TYPE.figure, color: COLORS.text },
});
