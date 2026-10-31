import { useLocalSearchParams } from "expo-router";

import { PaymentDetailScreen } from "@/screens/payment-detail";

export default function PaymentDetailRoute() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  return <PaymentDetailScreen paymentId={paymentId} />;
}
