import { expect, test } from "vitest";

import { de } from "../de";
import { en } from "../en";
import { itemName, t } from "../index";

test("every English key exists in German and is not empty", () => {
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(de[key], key).toBeTruthy();
  }
});

test("t fills in variables", () => {
  expect(t("en", "pay.expiresIn", { seconds: 42 })).toContain("42");
});

test("itemName picks the locale", () => {
  const name = { de: "Pasta mit Tomatensoße", en: "Pasta with tomato sauce" };
  expect(itemName(name, "de")).toBe("Pasta mit Tomatensoße");
  expect(itemName(name, "en")).toBe("Pasta with tomato sauce");
});
