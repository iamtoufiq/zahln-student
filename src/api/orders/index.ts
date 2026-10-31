import apiInstance from "@/api/api-instance";
import { ENDPOINTS } from "@/api/endpoints";

import type { Order } from "./interface";

/** The order behind a scanned QR, priced for the signed-in user's price group. */
export const getOrder = async (orderId: string): Promise<Order> =>
  (await apiInstance.request<Order>("GET", ENDPOINTS.ORDER(orderId))).data;
