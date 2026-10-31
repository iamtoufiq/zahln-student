import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { listPayments } from "@/api/payments";
import { paymentVersions } from "@/lib/versions";
import { useSessionStore } from "@/stores/session-store";

import { mergePages } from "./merge-pages";

const PAGE_SIZE = 20;
const PENDING_REFRESH_MS = 5000;

export function useHistory() {
  const username = useSessionStore((s) => s.savedUsername);

  const query = useInfiniteQuery({
    queryKey: ["payments", username],
    queryFn: ({ pageParam }) => listPayments({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: (q) =>
      q.state.data?.pages.some((page) => page.items.some((p) => p.status === "pending"))
        ? PENDING_REFRESH_MS
        : false,
  });

  const payments = useMemo(
    () => mergePages(query.data?.pages ?? [], paymentVersions),
    [query.data],
  );

  return {
    payments,
    loading: query.isPending,
    failed: query.isError,
    refreshing: query.isRefetching,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    refresh: query.refetch,
    loadMore: query.fetchNextPage,
  };
}
