import { expect, test } from "vitest";

import type { Payment, PaymentPage } from "@/api/payments/interface";

import { createVersionCache } from "@/core";

import { mergePages } from "../merge-pages";

const p = (id: string, version: number, createdAt: string) =>
  ({ id, version, createdAt, status: "pending" }) as Payment;
const page = (...items: Payment[]): PaymentPage => ({ items, nextCursor: null });

test("a payment that shows up on two pages keeps its higher version", () => {
  const merged = mergePages([
    page(p("a", 1, "2026-10-29T10:00:00Z"), p("b", 2, "2026-10-29T09:00:00Z")),
    page(p("b", 3, "2026-10-29T09:00:00Z"), p("c", 1, "2026-10-29T08:00:00Z")),
  ]);
  expect(merged.map((x) => [x.id, x.version])).toEqual([
    ["a", 1],
    ["b", 3],
    ["c", 1],
  ]);
});

test("a stale page does not overwrite a newer payment", () => {
  const merged = mergePages([
    page(p("a", 4, "2026-10-29T10:00:00Z")),
    page(p("a", 2, "2026-10-29T10:00:00Z")),
  ]);
  expect(merged).toHaveLength(1);
  expect(merged[0]!.version).toBe(4);
});

test("keeps newest first", () => {
  const merged = mergePages([
    page(p("old", 1, "2026-10-28T10:00:00Z")),
    page(p("new", 1, "2026-10-29T10:00:00Z")),
  ]);
  expect(merged.map((x) => x.id)).toEqual(["new", "old"]);
});

test("a refetch that returns an older version keeps what was shown before", () => {
  const versions = createVersionCache<Payment>();
  mergePages([page(p("a", 3, "2026-10-29T10:00:00Z"))], versions);
  const merged = mergePages([page(p("a", 2, "2026-10-29T10:00:00Z"))], versions);
  expect(merged[0]!.version).toBe(3);
});
