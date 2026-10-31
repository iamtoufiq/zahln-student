import type { KeyValue } from "@/lib/storage";

export type PayIntent = {
  orderId: string;
  key: string;
  amountCents: number;
  username: string;
  createdAt: number;
  paymentId?: string;
};

const PREFIX = "pay-intent:";

export type IntentStore = ReturnType<typeof createIntentStore>;

// An intent is written before the payment POST leaves the phone and cleared only once the outcome is known.
export function createIntentStore(kv: Pick<KeyValue, "get" | "set" | "delete" | "keys">) {
  const read = (orderId: string): PayIntent | undefined => {
    const raw = kv.get(PREFIX + orderId);
    return raw ? (JSON.parse(raw) as PayIntent) : undefined;
  };
  const write = (intent: PayIntent) => kv.set(PREFIX + intent.orderId, JSON.stringify(intent));

  return {
    get: read,
    start(orderId: string, amountCents: number, username: string, newKey: () => string): PayIntent {
      const existing = read(orderId);
      if (existing) {
        if (existing.amountCents !== amountCents || existing.username !== username) {
          throw new Error(`A different payment for ${orderId} is still open`);
        }
        return existing;
      }
      const intent: PayIntent = {
        orderId,
        key: newKey(),
        amountCents,
        username,
        createdAt: Date.now(),
      };
      write(intent);
      return intent;
    },
    attachPayment(orderId: string, paymentId: string) {
      const existing = read(orderId);
      if (existing) write({ ...existing, paymentId });
    },
    clear(orderId: string) {
      kv.delete(PREFIX + orderId);
    },
    live(username?: string): PayIntent[] {
      return kv
        .keys()
        .filter((key) => key.startsWith(PREFIX))
        .map((key) => read(key.slice(PREFIX.length))!)
        .filter((intent) => !username || intent.username === username)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
  };
}
