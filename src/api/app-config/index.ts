import apiInstance from "@/api/api-instance";
import { ENDPOINTS } from "@/api/endpoints";

import type { AppConfig } from "./interface";

/** Public: read before sign-in to decide whether payments are paused or the app is too old. */
export const getConfig = async (): Promise<AppConfig> =>
  (await apiInstance.request<AppConfig>("GET", ENDPOINTS.CONFIG, { anonymous: true })).data;
