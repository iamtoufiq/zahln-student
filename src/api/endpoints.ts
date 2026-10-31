// Paths are relative to API_CONFIG.BASE_URL (EXPO_PUBLIC_API_BASE_URL).
export const ENDPOINTS = {
  // Auth
  SESSIONS: "/sessions",

  // Config
  CONFIG: "/config",

  // Orders
  ORDER: (orderId: string) => `/orders/${encodeURIComponent(orderId)}`,
  ORDER_PAYMENTS: (orderId: string) => `/orders/${encodeURIComponent(orderId)}/payments`,

  // Payments
  PAYMENTS: "/payments",
  PAYMENT: (paymentId: string) => `/payments/${encodeURIComponent(paymentId)}`,
};
