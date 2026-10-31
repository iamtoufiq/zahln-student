import { useQuery } from "@tanstack/react-query";

import { getPayment } from "@/api/payments";
import { paymentDetailVersions } from "@/lib/versions";

const PENDING_REFRESH_MS = 3000;

export function usePaymentDetail(paymentId: string) {
  const query = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => paymentDetailVersions.keep(await getPayment(paymentId)),
    refetchInterval: (q) => (q.state.data?.status === "pending" ? PENDING_REFRESH_MS : false),
  });

  return {
    payment: query.data,
    loading: query.isPending,
    failed: query.isError,
    retry: query.refetch,
  };
}
