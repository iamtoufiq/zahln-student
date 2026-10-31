import { describe, expect, test, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { Order } from "@/api/orders/interface";
import type { Payment } from "@/api/payments/interface";

import { createIntentStore } from "../intent-store";
import { resolvePayment } from "../resolve-payment";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: string) => void map.set(k, v),
    delete: (k: string) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

const order = (paymentId: string | null) => ({ id: "ord_1", paymentId, version: 2 }) as Order;
const rejected = (status: number, code: string) => new ApiError(status, code, false, "rejected");

function setup(payOrder: () => Promise<unknown>, paymentId: string | null = null) {
  const intents = createIntentStore(memoryKv());
  intents.start("ord_1", 220, "student", () => "k1");
  const api = { payOrder: vi.fn(payOrder), getOrder: vi.fn(async () => order(paymentId)) };
  return { intents, api };
}

describe("resolvePayment", () => {
  test("a known payment id is used without sending anything", async () => {
    const { intents, api } = setup(async () => ({}));
    intents.attachPayment("ord_1", "pay_9");
    expect(await resolvePayment(api as never, intents, "ord_1")).toEqual({
      kind: "found",
      paymentId: "pay_9",
    });
    expect(api.payOrder).not.toHaveBeenCalled();
  });

  test("a resend with the same key that is replayed finds the payment", async () => {
    const { intents, api } = setup(async () => ({
      data: { id: "pay_1" } as Payment,
      replayed: true,
    }));
    expect(await resolvePayment(api as never, intents, "ord_1")).toEqual({
      kind: "found",
      paymentId: "pay_1",
    });
  });

  test("a refusal on resend still finds a payment that exists on the order", async () => {
    const { intents, api } = setup(async () => {
      throw rejected(503, "payments_disabled");
    }, "pay_7");
    expect(await resolvePayment(api as never, intents, "ord_1")).toEqual({
      kind: "found",
      paymentId: "pay_7",
    });
    expect(intents.get("ord_1")?.paymentId).toBe("pay_7");
  });

  test("a refusal with no payment on the order is final and clears the intent", async () => {
    const error = rejected(426, "app_version_unsupported");
    const { intents, api } = setup(async () => {
      throw error;
    }, null);
    expect(await resolvePayment(api as never, intents, "ord_1")).toEqual({
      kind: "rejected",
      error,
    });
    expect(intents.get("ord_1")).toBeUndefined();
  });

  test("an unknown outcome stays unknown", async () => {
    const { intents, api } = setup(async () => {
      throw new ApiError(504, "timeout", true, "unknown");
    });
    expect(await resolvePayment(api as never, intents, "ord_1")).toEqual({ kind: "unknown" });
    expect(intents.get("ord_1")).toBeDefined();
  });

  test("without an intent the order's payment id is used", async () => {
    const { intents, api } = setup(async () => ({}), "pay_3");
    intents.clear("ord_1");
    expect(await resolvePayment(api as never, intents, "ord_1")).toEqual({
      kind: "found",
      paymentId: "pay_3",
    });
  });
});
