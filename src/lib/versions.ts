import type { Order } from "@/api/orders/interface";
import type { Payment, PaymentDetail } from "@/api/payments/interface";
import { createVersionCache } from "@/core";

export const orderVersions = createVersionCache<Order>();
export const paymentVersions = createVersionCache<Payment>();
export const paymentDetailVersions = createVersionCache<PaymentDetail>();
