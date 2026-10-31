import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text } from "react-native";

import type { Payment } from "@/api/payments/interface";
import { useT } from "@/hooks/use-t";
import { Button, COLORS, Screen, SPACE, TYPE } from "@/ui";

import { PaymentRow, ROW_HEIGHT } from "./payment-row";
import { useHistory } from "./use-history";

const layout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

export function HistoryScreen() {
  const { t } = useT();
  const router = useRouter();
  const history = useHistory();

  const open = useCallback((id: string) => router.push(`/history/${id}`), [router]);
  const renderItem = useCallback(
    ({ item }: { item: Payment }) => <PaymentRow payment={item} onPress={open} />,
    [open],
  );

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        {t("history.title")}
      </Text>
      {history.loading ? <ActivityIndicator color={COLORS.primary} /> : null}
      {history.failed ? (
        <Button label={t("common.retry")} variant="secondary" onPress={() => history.refresh()} />
      ) : null}
      <FlatList
        testID="history-list"
        data={history.payments}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        getItemLayout={layout}
        style={styles.list}
        refreshing={history.refreshing}
        onRefresh={history.refresh}
        ListEmptyComponent={
          // A list that failed to load is not an empty list.
          history.loading || history.failed ? undefined : (
            <Text style={styles.empty}>{t("history.empty")}</Text>
          )
        }
        ListFooterComponent={
          history.hasMore ? (
            <Button
              label={t("history.loadMore")}
              variant="secondary"
              loading={history.loadingMore}
              onPress={() => history.loadMore()}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.hero, color: COLORS.primaryDark },
  list: { flex: 1, marginHorizontal: -SPACE.lg },
  empty: { ...TYPE.body, color: COLORS.muted, textAlign: "center", padding: SPACE.xl },
});
