import { ApiError } from "@/api/errors";
import type { payOrder } from "@/api/payments";
import type { Payment } from "@/api/payments/interface";

import type { IntentStore, PayIntent } from "./intent-store";

export type SubmitResult =
  | { kind: "accepted"; payment: Payment }
  | { kind: "unknown" }
  | { kind: "rejected"; error: ApiError };

// A payment may exist behind these, so the intent and its key must survive.
const KEEP_INTENT = new Set(["order_payment_in_progress", "idempotency_mismatch"]);

export async function submitPayment(
  api: { payOrder: typeof payOrder },
  intents: IntentStore,
  intent: PayIntent,
): Promise<SubmitResult> {
  try {
    const { data } = await api.payOrder(intent.orderId, intent.amountCents, intent.key);
    intents.attachPayment(intent.orderId, data.id);
    return { kind: "accepted", payment: data };
  } catch (error) {
    // Anything but a clear refusal may have reached the server, so the intent stays.
    if (!(error instanceof ApiError) || error.outcome !== "rejected") return { kind: "unknown" };
    if (!KEEP_INTENT.has(error.code)) intents.clear(intent.orderId);
    return { kind: "rejected", error };
  }
}
