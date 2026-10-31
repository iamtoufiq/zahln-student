import { Redirect, useLocalSearchParams } from "expo-router";

import { PayScreen } from "@/screens/pay";
import { useSessionStore } from "@/stores/session-store";

export default function PayRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const user = useSessionStore((s) => s.user);
  return user ? <PayScreen key={orderId} orderId={orderId} /> : <Redirect href="/" />;
}
