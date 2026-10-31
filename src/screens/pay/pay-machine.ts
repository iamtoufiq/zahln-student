import type { ApiError } from "@/api/errors";
import type { Order } from "@/api/orders/interface";
import type { Payment } from "@/api/payments/interface";
import { newer, secondsLeft } from "@/core";

import type { PayIntent } from "./intent-store";

export type BlockReason = "paused" | "update_required";

export type PayState =
  | { tag: "loading"; notice?: "amount_changed"; resuming?: boolean }
  | { tag: "review"; order: Order; notice?: "amount_changed" }
  | { tag: "authenticating"; order: Order }
  | { tag: "submitting"; order: Order; intent: PayIntent }
  | { tag: "checking"; order: Order; paymentId?: string; payment?: Payment; slow: boolean }
  | { tag: "confirmed"; order: Order; payment: Payment }
  | { tag: "declined"; order: Order; payment: Payment }
  | { tag: "expired" }
  | { tag: "already_paid" }
  | { tag: "blocked"; reason: BlockReason }
  | { tag: "error"; code: string };

export type PayEvent =
  | { type: "order_loaded"; order: Order; intent?: PayIntent; nowMs: number }
  | { type: "confirm_tapped"; nowMs: number }
  | { type: "blocked"; reason: BlockReason }
  | { type: "auth_ok"; intent: PayIntent; nowMs: number }
  | { type: "auth_cancelled" }
  | { type: "submit_accepted"; payment: Payment }
  | { type: "submit_unknown" }
  | { type: "submit_rejected"; error: ApiError }
  | { type: "payment_polled"; payment: Payment }
  | { type: "slow" }
  | { type: "tick"; nowMs: number }
  | { type: "load_failed"; code: string; intentLive: boolean }
  | { type: "failed"; code: string }
  | { type: "retry" };

const REJECTION_STATES: Record<string, PayState> = {
  amount_mismatch: { tag: "loading", notice: "amount_changed" },
  order_expired: { tag: "expired" },
  order_already_paid: { tag: "already_paid" },
  payments_disabled: { tag: "blocked", reason: "paused" },
  app_version_unsupported: { tag: "blocked", reason: "update_required" },
};

const isExpired = (order: Order, nowMs: number) => secondsLeft(order, nowMs) === 0;

function fromLoadedOrder(
  state: PayState,
  { order, intent, nowMs }: Extract<PayEvent, { type: "order_loaded" }>,
): PayState {
  const paymentId = intent?.paymentId ?? order.paymentId ?? undefined;
  if (intent || paymentId) return { tag: "checking", order, paymentId, slow: false };
  if (order.status === "paid") return { tag: "already_paid" };
  if (order.status === "expired" || isExpired(order, nowMs)) return { tag: "expired" };
  const notice = state.tag === "loading" ? state.notice : undefined;
  return notice ? { tag: "review", order, notice } : { tag: "review", order };
}

function fromPayment(
  order: Order,
  held: Payment | undefined,
  incoming: Payment,
  slow: boolean,
): PayState {
  const payment = newer(held, incoming);
  if (payment.status === "confirmed") return { tag: "confirmed", order, payment };
  if (payment.status === "declined") return { tag: "declined", order, payment };
  return { tag: "checking", order, paymentId: payment.id, payment, slow };
}

export function payReducer(state: PayState, event: PayEvent): PayState {
  switch (event.type) {
    case "order_loaded":
      return state.tag === "loading" || state.tag === "review"
        ? fromLoadedOrder(state, event)
        : state;
    case "load_failed":
      if (state.tag !== "loading") return state;
      // With an attempt on record the payment may exist, so the screen keeps asking instead.
      if (event.intentLive) return state.resuming ? state : { ...state, resuming: true };
      return { tag: "error", code: event.code };
    case "failed":
      return state.tag === "authenticating" ? { tag: "error", code: event.code } : state;
    case "confirm_tapped":
      if (state.tag !== "review" || state.order.status !== "open") return state;
      return isExpired(state.order, event.nowMs)
        ? { tag: "expired" }
        : { tag: "authenticating", order: state.order };
    case "blocked":
      return state.tag === "authenticating" ? { tag: "blocked", reason: event.reason } : state;
    case "auth_ok":
      if (state.tag !== "authenticating") return state;
      if (isExpired(state.order, event.nowMs)) return { tag: "expired" };
      return { tag: "submitting", order: state.order, intent: event.intent };
    case "auth_cancelled":
      return state.tag === "authenticating" ? { tag: "review", order: state.order } : state;
    case "submit_accepted":
      return state.tag === "submitting" || state.tag === "checking"
        ? fromPayment(state.order, undefined, event.payment, false)
        : state;
    case "submit_unknown":
      return state.tag === "submitting"
        ? { tag: "checking", order: state.order, slow: false }
        : state;
    case "submit_rejected":
      if (state.tag !== "submitting" && state.tag !== "checking") return state;
      if (event.error.code === "order_payment_in_progress") {
        return { tag: "checking", order: state.order, slow: false };
      }
      return REJECTION_STATES[event.error.code] ?? { tag: "error", code: event.error.code };
    case "payment_polled":
      if (state.tag === "checking")
        return fromPayment(state.order, state.payment, event.payment, state.slow);
      if (state.tag === "confirmed" || state.tag === "declined") {
        return newer(state.payment, event.payment) === state.payment
          ? state
          : fromPayment(state.order, state.payment, event.payment, false);
      }
      return state;
    case "slow":
      return state.tag === "checking" ? { ...state, slow: true } : state;
    case "tick":
      if (state.tag !== "review" && state.tag !== "authenticating") return state;
      return isExpired(state.order, event.nowMs) ? { tag: "expired" } : state;
    case "retry":
      return state.tag === "declined" || state.tag === "error" ? { tag: "loading" } : state;
  }
}
