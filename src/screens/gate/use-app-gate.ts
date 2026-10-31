import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { AppConfig } from "@/api/app-config/interface";
import { appVersion } from "@/api/api-instance";
import { getConfig } from "@/api/app-config";

import { isBelow } from "./semver";

export type GateState = "loading" | "ok" | "paused" | "update_required";

const CONFIG_QUERY = { queryKey: ["config"], queryFn: getConfig };

export function gateFor(config: AppConfig): GateState {
  if (isBelow(config.minAppVersion, appVersion)) return "update_required";
  return config.paymentsEnabled ? "ok" : "paused";
}

export function useAppGate() {
  const queryClient = useQueryClient();
  const query = useQuery(CONFIG_QUERY);

  const state: GateState = query.data ? gateFor(query.data) : "loading";

  // The server enforces both switches too, so an unreachable config does not block paying.
  const recheck = useCallback(async (): Promise<GateState> => {
    try {
      return gateFor(await queryClient.fetchQuery({ ...CONFIG_QUERY, staleTime: 0 }));
    } catch {
      return "ok";
    }
  }, [queryClient]);

  return { state, recheck };
}
