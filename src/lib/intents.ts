import { createIntentStore } from "@/screens/pay/intent-store";

import { kv } from "./storage";

export const intents = createIntentStore(kv);
