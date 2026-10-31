import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/errors";
import type { Order } from "@/api/orders/interface";
import type { Payment } from "@/api/payments/interface";

import type { PayIntent } from "../intent-store";
import { payReducer, type PayState } from "../pay-machine";

const NOW = Date.parse("2026-10-29T04:22:00Z");
const order = (patch: Partial<Order> = {}) =>
  ({
    id: "ord_1",
    status: "open",
    amountCents: 220,
    expiresAt: "2026-10-29T04:26:00Z",
    paymentId: null,
    version: 1,
    ...patch,
  }) as Order;
const payment = (status: Payment["status"], version: number) =>
  ({ id: "pay_1", status, version, amountCents: 220 }) as Payment;
const intent: PayIntent = {
  orderId: "ord_1",
  key: "k",
  amountCents: 220,
  username: "student",
  createdAt: 0,
};
const rejected = (code: string) => new ApiError(409, code, false, "rejected");

const review: PayState = { tag: "review", order: order() };
const checking = (p?: Payment): PayState => ({
  tag: "checking",
  order: order(),
  payment: p,
  slow: false,
});

describe("loading an order", () => {
  test("an open order goes to review", () => {
    expect(
      payReducer({ tag: "loading" }, { type: "order_loaded", order: order(), nowMs: NOW }),
    ).toEqual(review);
  });

  test("a live intent resumes checking instead of offering to pay again", () => {
    const next = payReducer(
      { tag: "loading" },
      { type: "order_loaded", order: order(), intent, nowMs: NOW },
    );
    expect(next.tag).toBe("checking");
  });

  test("an order with my payment on it resumes checking", () => {
    const next = payReducer(
      { tag: "loading" },
      { type: "order_loaded", order: order({ status: "paying", paymentId: "pay_1" }), nowMs: NOW },
    );
    expect(next).toMatchObject({ tag: "checking", paymentId: "pay_1" });
  });

  test("a paid order without my payment is already paid", () => {
    const next = payReducer(
      { tag: "loading" },
      { type: "order_loaded", order: order({ status: "paid" }), nowMs: NOW },
    );
    expect(next.tag).toBe("already_paid");
  });

  test("an open order past expiresAt by server time is expired", () => {
    const next = payReducer(
      { tag: "loading" },
      { type: "order_loaded", order: order(), nowMs: Date.parse("2026-10-29T04:27:00Z") },
    );
    expect(next.tag).toBe("expired");
  });
});

describe("confirming", () => {
  test("confirm on an order that is not open is ignored", () => {
    const state: PayState = { tag: "review", order: order({ status: "paying" }) };
    expect(payReducer(state, { type: "confirm_tapped", nowMs: NOW })).toBe(state);
  });

  test("expired by server clock blocks submit", () => {
    const authenticating: PayState = { tag: "authenticating", order: order() };
    const late = Date.parse("2026-10-29T04:26:01Z");
    expect(payReducer(authenticating, { type: "auth_ok", intent, nowMs: late }).tag).toBe(
      "expired",
    );
  });

  test("auth cancelled goes back to review", () => {
    expect(
      payReducer({ tag: "authenticating", order: order() }, { type: "auth_cancelled" }),
    ).toEqual(review);
  });
});

describe("outcome", () => {
  test("submit_unknown never yields an error", () => {
    const submitting: PayState = { tag: "submitting", order: order(), intent };
    expect(payReducer(submitting, { type: "submit_unknown" }).tag).toBe("checking");
  });

  test("pending turns into paid only when the payment is confirmed", () => {
    let state = payReducer(checking(), { type: "payment_polled", payment: payment("pending", 1) });
    expect(state.tag).toBe("checking");
    state = payReducer(state, { type: "payment_polled", payment: payment("confirmed", 2) });
    expect(state.tag).toBe("confirmed");
  });

  test("a poll with a lower version is ignored", () => {
    const confirmed = payReducer(checking(), {
      type: "payment_polled",
      payment: payment("confirmed", 3),
    });
    expect(payReducer(confirmed, { type: "payment_polled", payment: payment("pending", 2) })).toBe(
      confirmed,
    );
  });

  test("amount_mismatch reloads the order and says the amount changed", () => {
    const submitting: PayState = { tag: "submitting", order: order(), intent };
    expect(
      payReducer(submitting, { type: "submit_rejected", error: rejected("amount_mismatch") }),
    ).toEqual({
      tag: "loading",
      notice: "amount_changed",
    });
  });

  test("payments_disabled blocks with paused", () => {
    const submitting: PayState = { tag: "submitting", order: order(), intent };
    const next = payReducer(submitting, {
      type: "submit_rejected",
      error: new ApiError(503, "payments_disabled", false, "rejected"),
    });
    expect(next).toEqual({ tag: "blocked", reason: "paused" });
  });

  test("declined allows a retry that reloads the order", () => {
    const declined = payReducer(checking(), {
      type: "payment_polled",
      payment: payment("declined", 2),
    });
    expect(payReducer(declined, { type: "retry" })).toEqual({ tag: "loading" });
  });

  test("slow marks checking as slow", () => {
    expect(payReducer(checking(), { type: "slow" })).toMatchObject({ tag: "checking", slow: true });
  });
});

describe("failures that must not claim nothing was charged", () => {
  test("a failed load with a live intent keeps checking instead of showing an error", () => {
    expect(
      payReducer(
        { tag: "loading" },
        { type: "load_failed", code: "unavailable", intentLive: true },
      ),
    ).toEqual({ tag: "loading", resuming: true });
  });

  test("a resumed payment that loads goes on to checking", () => {
    expect(
      payReducer(
        { tag: "loading", resuming: true },
        { type: "order_loaded", order: order(), intent, nowMs: NOW },
      ),
    ).toMatchObject({ tag: "checking" });
  });

  test("a failed load with no intent is an error", () => {
    expect(
      payReducer({ tag: "loading" }, { type: "load_failed", code: "not_found", intentLive: false }),
    ).toEqual({
      tag: "error",
      code: "not_found",
    });
  });

  test("a local failure while confirming goes to an error, not a stuck spinner", () => {
    expect(
      payReducer(
        { tag: "authenticating", order: order() },
        { type: "failed", code: "intent_conflict" },
      ),
    ).toEqual({
      tag: "error",
      code: "intent_conflict",
    });
  });
});
