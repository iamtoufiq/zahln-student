import { ApiError } from "@/api/errors";
import type { getOrder } from "@/api/orders";
import type { payOrder } from "@/api/payments";

import type { IntentStore } from "./intent-store";

export type Resolution =
  | { kind: "found"; paymentId: string }
  | { kind: "unknown" }
  | { kind: "rejected"; error: ApiError };

const STILL_OPEN = new Set(["order_payment_in_progress", "idempotency_mismatch"]);

// Finds the payment behind an earlier attempt whose answer never arrived.
export async function resolvePayment(
  api: { payOrder: typeof payOrder; getOrder: typeof getOrder },
  intents: IntentStore,
  orderId: string,
): Promise<Resolution> {
  const intent = intents.get(orderId);
  if (intent?.paymentId) return { kind: "found", paymentId: intent.paymentId };

  if (intent) {
    try {
      const { data } = await api.payOrder(orderId, intent.amountCents, intent.key);
      intents.attachPayment(orderId, data.id);
      return { kind: "found", paymentId: data.id };
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      if (error.outcome !== "rejected") return { kind: "unknown" };
      const { paymentId } = await api.getOrder(orderId);
      if (paymentId) {
        intents.attachPayment(orderId, paymentId);
        return { kind: "found", paymentId };
      }
      if (STILL_OPEN.has(error.code)) return { kind: "unknown" };
      intents.clear(orderId);
      return { kind: "rejected", error };
    }
  }

  const { paymentId } = await api.getOrder(orderId);
  return paymentId ? { kind: "found", paymentId } : { kind: "unknown" };
}
