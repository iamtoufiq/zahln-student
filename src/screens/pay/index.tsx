import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";

import { useT } from "@/hooks/use-t";
import { COLORS, Screen } from "@/ui";

import { PinSheet } from "./pin-sheet";
import { Result } from "./result";
import { resultFor } from "./result-for";
import { Review } from "./review";
import { usePay } from "./use-pay";

export function PayScreen({ orderId }: { orderId: string }) {
  const { t } = useT();
  const router = useRouter();
  const { state, seconds, amount, pinVisible, confirm, submit, cancelAuth, retry } =
    usePay(orderId);
  const result = resultFor(state);
  const mensa = "order" in state ? state.order.mensa.name : "";
  const retryAction = result?.canRetry
    ? { label: t("common.retry"), onPress: retry, testID: "pay-retry" }
    : undefined;

  return (
    <Screen>
      {state.tag === "loading" && !result ? (
        <ActivityIndicator
          style={styles.loading}
          color={COLORS.primary}
          accessibilityLabel={t("pay.loading")}
        />
      ) : null}
      {state.tag === "review" || state.tag === "authenticating" ? (
        <Review
          order={state.order}
          seconds={seconds}
          amount={amount}
          busy={state.tag === "authenticating"}
          amountChanged={state.tag === "review" && state.notice === "amount_changed"}
          onConfirm={confirm}
        />
      ) : null}
      {result ? (
        <Result
          tone={result.tone}
          title={result.title}
          body={result.body ? t(result.body, { amount, mensa }) : undefined}
          action={retryAction}
          onDone={() => router.replace("/home")}
        />
      ) : null}
      <PinSheet visible={pinVisible} onSuccess={submit} onCancel={cancelAuth} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
});
