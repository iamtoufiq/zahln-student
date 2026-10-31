import { Pressable, StyleSheet, Text, View } from "react-native";

import { useT } from "@/hooks/use-t";
import { GateNotice } from "@/screens/gate";
import { Button, COLORS, RADIUS, Screen, SPACE, TYPE } from "@/ui";

import { useHome } from "./use-home";

export function HomeScreen() {
  const { t } = useT();
  const {
    user,
    gate,
    canPay,
    openOrderId,
    openPayment,
    scan,
    history,
    openDevFaults,
    switchUser,
    toggleLocale,
  } = useHome();
  const group = user?.priceGroup ? t(`group.${user.priceGroup}`) : "";

  return (
    <Screen>
      <View style={styles.hero}>
        <Pressable onLongPress={openDevFaults} accessible={false}>
          <Text accessibilityRole="header" style={styles.greeting}>
            {t("home.greeting", { name: user?.displayName ?? "" })}
          </Text>
        </Pressable>
        <Text style={styles.group}>{t("home.priceGroup", { group })}</Text>
      </View>
      <GateNotice state={gate} />
      {openOrderId ? (
        <Pressable
          testID="open-payment"
          accessibilityRole="button"
          accessibilityHint={t("home.openPaymentHint")}
          onPress={openPayment}
          style={styles.openPayment}
        >
          <Text style={styles.openPaymentText}>{t("home.openPayment")}</Text>
        </Pressable>
      ) : null}
      <Button
        testID="scan"
        label={t("home.scan")}
        accessibilityHint={t("home.scanHint")}
        disabled={!canPay}
        onPress={scan}
      />
      <Button testID="history" label={t("home.history")} variant="secondary" onPress={history} />
      <View style={styles.spacer} />
      <Button
        testID="language"
        label={t("common.language")}
        accessibilityHint={t("common.languageHint")}
        variant="secondary"
        onPress={toggleLocale}
      />
      <Button
        testID="switch-user"
        label={t("common.signOut")}
        variant="secondary"
        onPress={switchUser}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    gap: SPACE.xs,
  },
  greeting: { ...TYPE.hero, color: COLORS.onPrimary },
  group: { ...TYPE.body, color: COLORS.primaryTint },
  openPayment: {
    backgroundColor: COLORS.primaryTint,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
  },
  openPaymentText: { ...TYPE.bodyStrong, color: COLORS.primary },
  spacer: { flex: 1 },
});
