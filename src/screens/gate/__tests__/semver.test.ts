import { expect, test } from "vitest";

import { isBelow } from "../semver";

test("compares versions number by number, not as text", () => {
  expect(isBelow("1.2.0", "1.10.0")).toBe(false);
  expect(isBelow("1.10.0", "1.2.0")).toBe(true);
});

test("an older major is below", () => {
  expect(isBelow("2.0.0", "1.9.9")).toBe(true);
});

test("the same version is not below", () => {
  expect(isBelow("1.0.0", "1.0.0")).toBe(false);
});

test("missing parts count as zero", () => {
  expect(isBelow("1.1", "1.1.0")).toBe(false);
  expect(isBelow("1.1.1", "1.1")).toBe(true);
});
