import { useQueryClient } from "@tanstack/react-query";
import { type Dispatch, useEffect } from "react";

import { getOrder } from "@/api/orders";
import { getPayment, payOrder } from "@/api/payments";
import { intents } from "@/lib/intents";
import { orderVersions } from "@/lib/versions";

import type { PayEvent, PayState } from "./pay-machine";
import { resolvePayment } from "./resolve-payment";
import { submitPayment } from "./submit-payment";

const FAST_POLL_MS = 1000;
const SLOW_POLL_MS = 3000;
const FAST_WINDOW_MS = 10_000;
const SLOW_AFTER_MS = 30_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getVersionedOrder = async (orderId: string) => orderVersions.keep(await getOrder(orderId));

// Sends the POST for a submitting state, then polls a checking state until the server decides.
export function usePaymentOutcome(state: PayState, dispatch: Dispatch<PayEvent>) {
  const queryClient = useQueryClient();
  const orderId = "order" in state ? state.order.id : undefined;
  const checkingFor = state.tag === "checking" ? (state.payment?.id ?? state.paymentId) : undefined;

  useEffect(() => {
    if (state.tag !== "submitting") return;
    let live = true;
    void submitPayment({ payOrder }, intents, state.intent).then(
      (result) => {
        if (!live) return;
        if (result.kind === "accepted")
          dispatch({ type: "submit_accepted", payment: result.payment });
        else if (result.kind === "unknown") dispatch({ type: "submit_unknown" });
        else dispatch({ type: "submit_rejected", error: result.error });
      },
      // The request may have left the phone, so the screen goes on checking.
      () => live && dispatch({ type: "submit_unknown" }),
    );
    return () => {
      live = false;
    };
  }, [state, dispatch]);

  useEffect(() => {
    if (state.tag !== "checking" || !orderId) return;
    let live = true;
    let slowSent = false;
    let paymentId = checkingFor;
    const startedAt = Date.now();

    async function loop() {
      while (live) {
        const elapsed = Date.now() - startedAt;
        if (elapsed > SLOW_AFTER_MS && !slowSent) {
          slowSent = true;
          dispatch({ type: "slow" });
        }
        try {
          if (!paymentId) {
            const resolved = await resolvePayment(
              { getOrder: getVersionedOrder, payOrder },
              intents,
              orderId!,
            );
            if (resolved.kind === "rejected") {
              if (live) dispatch({ type: "submit_rejected", error: resolved.error });
              return;
            }
            if (resolved.kind === "found") paymentId = resolved.paymentId;
          }
          if (paymentId) {
            const payment = await getPayment(paymentId);
            if (live) dispatch({ type: "payment_polled", payment });
          }
        } catch {
          // Any failure here only delays the answer; the next round asks again.
        }
        await sleep(elapsed < FAST_WINDOW_MS ? FAST_POLL_MS : SLOW_POLL_MS);
      }
    }

    void loop();
    return () => {
      live = false;
    };
  }, [state.tag, orderId, checkingFor, dispatch]);

  useEffect(() => {
    if ((state.tag === "confirmed" || state.tag === "declined") && orderId) {
      intents.clear(orderId);
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    }
  }, [state.tag, orderId, queryClient]);
}
