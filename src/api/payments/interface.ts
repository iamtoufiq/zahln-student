import type { Schemas } from "@/api/interface";

export type Payment = Schemas["Payment"];
export type PaymentDetail = Schemas["PaymentDetail"];
export type PaymentEvent = Schemas["PaymentEvent"];
export type PaymentPage = Schemas["PaymentPage"];

export type PaymentFilters = {
  status?: Payment["status"];
  limit?: number;
  cursor?: string;
};
