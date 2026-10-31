import { describe, expect, test, vi } from "vitest";

import { createIntentStore } from "../intent-store";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: string) => void map.set(k, v),
    delete: (k: string) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

describe("createIntentStore", () => {
  test("second start for the same order reuses the live intent", () => {
    const store = createIntentStore(memoryKv());
    const newKey = vi.fn(() => "key-1");

    const first = store.start("ord_1", 220, "student", newKey);
    const second = store.start("ord_1", 220, "student", newKey);

    expect(second.key).toBe(first.key);
    expect(newKey).toHaveBeenCalledTimes(1);
  });

  test("start with a different amount throws while an intent is live", () => {
    const store = createIntentStore(memoryKv());
    store.start("ord_1", 220, "student", () => "key-1");
    expect(() => store.start("ord_1", 380, "student", () => "key-2")).toThrow();
  });

  test("clear then start mints a new key", () => {
    const store = createIntentStore(memoryKv());
    store.start("ord_1", 220, "student", () => "key-1");
    store.clear("ord_1");
    expect(store.start("ord_1", 220, "student", () => "key-2").key).toBe("key-2");
  });

  test("resumes a live intent after relaunch", () => {
    const kv = memoryKv();
    createIntentStore(kv).start("ord_1", 220, "student", () => "key-1");
    createIntentStore(kv).attachPayment("ord_1", "pay_9");

    const relaunched = createIntentStore(kv);

    expect(relaunched.live()).toMatchObject([
      { orderId: "ord_1", key: "key-1", paymentId: "pay_9" },
    ]);
  });

  test("intents of another user are not live for this user", () => {
    const store = createIntentStore(memoryKv());
    store.start("ord_1", 220, "staff", () => "key-1");
    expect(store.live("student")).toEqual([]);
    expect(store.live("staff")).toHaveLength(1);
  });
});
