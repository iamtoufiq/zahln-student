import { afterEach, describe, expect, test, vi } from "vitest";

import { withinBudget } from "../budget";

afterEach(() => vi.useRealTimers());

describe("withinBudget", () => {
  test("an answer inside the budget wins", async () => {
    expect(await withinBudget(Promise.resolve("paused"), 3000, "ok")).toBe("paused");
  });

  test("a slow answer falls back once the budget is spent", async () => {
    vi.useFakeTimers();
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve("paused"), 60_000));
    const result = withinBudget(slow, 3000, "ok");
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toBe("ok");
  });

  test("a failure falls back", async () => {
    expect(await withinBudget(Promise.reject(new Error("offline")), 3000, "ok")).toBe("ok");
  });
});
