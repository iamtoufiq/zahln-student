import { Redirect, useLocalSearchParams } from "expo-router";

import { parseOrderQr } from "@/core";

// Entry for zahln://pay?order=<id>, the link inside the till's QR code.
export default function PayLink() {
  const { order } = useLocalSearchParams<{ order?: string }>();
  const orderId = order ? parseOrderQr(order) : null;
  return <Redirect href={orderId ? `/pay/${orderId}` : "/home"} />;
}
