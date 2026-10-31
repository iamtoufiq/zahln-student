import apiInstance, { type ApiResult } from "@/api/api-instance";
import { ENDPOINTS } from "@/api/endpoints";

import type { Payment, PaymentDetail, PaymentFilters, PaymentPage } from "./interface";

/**
 * Pays an order. Every retry must reuse `key`: the server replays the first
 * answer for a known key instead of charging again.
 */
export const payOrder = (
  orderId: string,
  amountCents: number,
  key: string,
): Promise<ApiResult<Payment>> =>
  apiInstance.request<Payment>("POST", ENDPOINTS.ORDER_PAYMENTS(orderId), {
    body: { amountCents },
    idempotencyKey: key,
    sendAppVersion: true,
  });

/** The signed-in user's payments, newest first. */
export const listPayments = async (filters: PaymentFilters = {}): Promise<PaymentPage> =>
  (await apiInstance.request<PaymentPage>("GET", ENDPOINTS.PAYMENTS, { query: filters })).data;

export const getPayment = async (paymentId: string): Promise<PaymentDetail> =>
  (await apiInstance.request<PaymentDetail>("GET", ENDPOINTS.PAYMENT(paymentId))).data;
