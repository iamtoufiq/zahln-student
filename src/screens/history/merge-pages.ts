import type { Payment, PaymentPage } from "@/api/payments/interface";
import { createVersionCache } from "@/core";

export function mergePages(
  pages: PaymentPage[],
  versions = createVersionCache<Payment>(),
): Payment[] {
  const byId = new Map<string, Payment>();
  for (const page of pages) {
    for (const payment of page.items) byId.set(payment.id, versions.keep(payment));
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
