import { describe, expect, test } from "vitest";

import { resultFor } from "../result-for";

const error = (code: string) => resultFor({ tag: "error", code });

describe("resultFor", () => {
  test("a resumed payment that cannot load yet shows that it is being checked", () => {
    expect(resultFor({ tag: "loading", resuming: true })).toMatchObject({
      tone: "pending",
      title: "pay.checking",
    });
  });

  test("a first load shows no result", () => {
    expect(resultFor({ tag: "loading" })).toBeNull();
  });

  test("an order that cannot be loaded says so, not that something failed", () => {
    for (const code of ["network", "timeout", "unavailable", "connection_dropped"]) {
      expect(error(code)).toMatchObject({ title: "pay.loadFailed", canRetry: true });
    }
  });

  test("an unknown order code points back to the cashier", () => {
    expect(error("not_found")).toMatchObject({ title: "pay.notFound", canRetry: false });
  });

  test("another user's open payment on this phone is named", () => {
    expect(error("intent_conflict")).toMatchObject({ title: "pay.intentConflict" });
  });

  test("a sign-in failure asks to sign in again", () => {
    expect(error("session_expired")).toMatchObject({ title: "pay.signedOut" });
    expect(error("unauthorized")).toMatchObject({ title: "pay.signedOut" });
  });

  test("a payment the server refused for another reason says nothing was charged", () => {
    expect(error("validation_failed")).toMatchObject({ title: "pay.notCharged", canRetry: true });
  });
});
