import { describe, expect, test, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { Payment } from "@/api/payments/interface";

import { createIntentStore } from "../intent-store";
import { submitPayment } from "../submit-payment";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: string) => void map.set(k, v),
    delete: (k: string) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

const payment = { id: "pay_1", status: "pending", version: 1 } as Payment;
const unknown = new ApiError(504, "timeout", true, "unknown");
const rejected = (code: string) => new ApiError(409, code, false, "rejected");

function setup(payOrder: (orderId: string, amount: number, key: string) => Promise<unknown>) {
  const intents = createIntentStore(memoryKv());
  const intent = intents.start("ord_1", 220, "student", () => "key-1");
  const api = { payOrder: vi.fn(payOrder) } as never;
  return { intents, intent, api };
}

describe("submitPayment", () => {
  test("an unexpected failure is an unknown outcome and keeps the intent", async () => {
    const { intents, intent, api } = setup(async () => {
      throw new TypeError("Cannot read properties of null");
    });

    expect(await submitPayment(api, intents, intent)).toEqual({ kind: "unknown" });
    expect(intents.get("ord_1")?.key).toBe("key-1");
  });

  test("an accepted payment is attached to the intent", async () => {
    const { intents, intent, api } = setup(async () => ({ data: payment, replayed: true }));

    const result = await submitPayment(api, intents, intent);

    expect(result).toEqual({ kind: "accepted", payment });
    expect(intents.get("ord_1")?.paymentId).toBe("pay_1");
  });

  test("sends the intent's key and amount", async () => {
    const { intents, intent, api } = setup(async () => ({ data: payment, replayed: false }));
    await submitPayment(api, intents, intent);
    expect((api as { payOrder: ReturnType<typeof vi.fn> }).payOrder).toHaveBeenCalledWith(
      "ord_1",
      220,
      "key-1",
    );
  });

  test("an unknown outcome keeps the intent", async () => {
    const { intents, intent, api } = setup(async () => {
      throw unknown;
    });

    expect(await submitPayment(api, intents, intent)).toEqual({ kind: "unknown" });
    expect(intents.get("ord_1")).toBeDefined();
  });

  test("a rejection clears the intent", async () => {
    const error = rejected("amount_mismatch");
    const { intents, intent, api } = setup(async () => {
      throw error;
    });

    expect(await submitPayment(api, intents, intent)).toEqual({ kind: "rejected", error });
    expect(intents.get("ord_1")).toBeUndefined();
  });

  test("payment in progress keeps the intent so the app can find that payment", async () => {
    const { intents, intent, api } = setup(async () => {
      throw rejected("order_payment_in_progress");
    });

    await submitPayment(api, intents, intent);

    expect(intents.get("ord_1")).toBeDefined();
  });

  test("an idempotency mismatch keeps the intent", async () => {
    const { intents, intent, api } = setup(async () => {
      throw new ApiError(422, "idempotency_mismatch", false, "rejected");
    });

    await submitPayment(api, intents, intent);

    expect(intents.get("ord_1")).toBeDefined();
  });
});
