import { StyleSheet, Text } from "react-native";

import { useT } from "@/hooks/use-t";
import { Button, COLORS, Screen, TYPE } from "@/ui";

import { PAYERS, usePickUser } from "./use-pick-user";

export function PickUserScreen() {
  const { t } = useT();
  const { pending, failed, pick } = usePickUser();

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        {t("pickUser.title")}
      </Text>
      <Text style={styles.subtitle}>{t("pickUser.subtitle")}</Text>
      {PAYERS.map((name) => (
        <Button
          key={name}
          testID={`pick-${name}`}
          label={t(`group.${name}`)}
          variant="secondary"
          loading={pending === name}
          disabled={pending !== null}
          onPress={() => pick(name)}
        />
      ))}
      {failed ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t("error.generic")}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.hero, color: COLORS.primaryDark },
  subtitle: { ...TYPE.body, color: COLORS.muted },
  error: { ...TYPE.body, color: COLORS.danger },
});
