import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { formatCents, formatDateTime, itemName } from "@/core";
import { useT } from "@/hooks/use-t";
import { toneFor } from "@/screens/history/status-tone";
import { Amount, Button, Card, COLORS, Screen, SPACE, StatusBadge, TYPE } from "@/ui";

import { usePaymentDetail } from "./use-payment-detail";

export function PaymentDetailScreen({ paymentId }: { paymentId: string }) {
  const { t, locale } = useT();
  const { payment, loading, failed, retry } = usePaymentDetail(paymentId);

  if (loading)
    return (
      <Screen>
        <ActivityIndicator color={COLORS.primary} />
      </Screen>
    );
  // A failed refresh keeps showing the payment already loaded.
  if (!payment) {
    return (
      <Screen>
        <Text style={styles.muted}>{t("error.generic")}</Text>
        <Button label={t("common.retry")} onPress={() => retry()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Card>
        <Text accessibilityRole="header" style={styles.title}>
          {payment.mensa.name}
        </Text>
        <Amount cents={payment.amountCents} locale={locale} size="xl" />
        <StatusBadge tone={toneFor(payment.status)} label={t(`status.${payment.status}`)} />
        {payment.refundedAmountCents > 0 ? (
          <Text style={styles.body}>
            {t("detail.refunded")}: {formatCents(payment.refundedAmountCents, locale)}
          </Text>
        ) : null}
        {payment.pendingRefundAmountCents > 0 ? (
          <Text style={styles.body}>
            {t("detail.refundPending")}: {formatCents(payment.pendingRefundAmountCents, locale)}
          </Text>
        ) : null}
        {failed ? <Text style={styles.muted}>{t("detail.stale")}</Text> : null}
      </Card>
      <Card>
        <Text style={styles.section}>{t("detail.items")}</Text>
        {payment.items.map((item) => (
          <View key={item.itemId} style={styles.row} accessible>
            <Text style={styles.body}>
              {item.quantity} × {itemName(item.name, locale)}
            </Text>
            <Text style={styles.body}>
              {formatCents(item.unitPriceCents * item.quantity, locale)}
            </Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={styles.section}>{t("detail.history")}</Text>
        {payment.history.map((event) => (
          <View key={event.at + event.type} style={styles.row} accessible>
            <Text style={styles.body}>{t(`event.${event.type}`)}</Text>
            <Text style={styles.muted}>{formatDateTime(event.at, locale)}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={styles.muted}>
          {t("detail.date")}: {formatDateTime(payment.createdAt, locale)}
        </Text>
        <Text style={styles.muted}>
          {t("detail.till")}: {payment.till.name}
        </Text>
        <Text style={styles.muted} selectable>
          {t("detail.reference")}: {payment.id}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.title, color: COLORS.text },
  section: { ...TYPE.heading, color: COLORS.text },
  row: { flexDirection: "row", justifyContent: "space-between", gap: SPACE.md },
  body: { ...TYPE.body, color: COLORS.text },
  muted: { ...TYPE.body, color: COLORS.muted },
});
