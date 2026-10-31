import { StyleSheet, Text, View } from "react-native";

import type { Order } from "@/api/orders/interface";
import { itemName } from "@/core";
import { useT } from "@/hooks/use-t";
import { Amount, Button, Card, COLORS, SPACE, TYPE } from "@/ui";

type Props = {
  order: Order;
  seconds: number;
  amount: string;
  busy: boolean;
  amountChanged: boolean;
  onConfirm: () => void;
};

export function Review({ order, seconds, amount, busy, amountChanged, onConfirm }: Props) {
  const { t, locale } = useT();
  const group = order.priceGroup ? t(`group.${order.priceGroup}`) : "";
  const payable = order.status === "open" && seconds > 0;

  return (
    <>
      <Card>
        <Text accessibilityRole="header" style={styles.mensa}>
          {order.mensa.name}
        </Text>
        <Text style={styles.muted}>{order.till.name}</Text>
        {order.items.map((item) => (
          <View key={item.itemId} style={styles.row} accessible>
            <Text style={styles.item}>
              {item.quantity} × {itemName(item.name, locale)}
            </Text>
            {item.unitPriceCents != null ? (
              <Amount cents={item.unitPriceCents * item.quantity} locale={locale} />
            ) : null}
          </View>
        ))}
      </Card>
      <Card>
        <Text style={styles.muted}>{t("pay.yourPrice", { group })}</Text>
        {order.amountCents != null ? (
          <Amount testID="pay-amount" cents={order.amountCents} locale={locale} size="xl" />
        ) : null}
        <Text style={styles.muted} accessibilityLiveRegion="none">
          {t("pay.expiresIn", { seconds })}
        </Text>
      </Card>
      {amountChanged ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.notice}>
          {t("pay.amountChanged")}
        </Text>
      ) : null}
      {!payable ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>
          {t("pay.notOpen")}
        </Text>
      ) : null}
      <View style={styles.spacer} />
      <Button
        testID="pay-confirm"
        label={t("pay.confirm", { amount })}
        accessibilityHint={t("pay.confirmHint")}
        loading={busy}
        disabled={!payable}
        onPress={onConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  mensa: { ...TYPE.title, color: COLORS.text },
  muted: { ...TYPE.body, color: COLORS.muted },
  row: { flexDirection: "row", justifyContent: "space-between", gap: SPACE.md },
  item: { ...TYPE.body, color: COLORS.text, flex: 1 },
  notice: { ...TYPE.body, color: COLORS.danger },
  spacer: { flex: 1 },
});
