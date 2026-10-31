import type { MessageKey } from "@/core";

import type { PayState } from "./pay-machine";
import type { ResultTone } from "./result";

export type ResultView = {
  tone: ResultTone;
  title: MessageKey;
  body?: MessageKey;
  canRetry?: boolean;
};

const CHECKING: ResultView = { tone: "pending", title: "pay.checking", body: "pay.checkingBody" };

const LOAD_FAILED: ResultView = {
  tone: "danger",
  title: "pay.loadFailed",
  body: "pay.loadFailedBody",
  canRetry: true,
};
const SIGNED_OUT: ResultView = {
  tone: "neutral",
  title: "pay.signedOut",
  body: "pay.signedOutBody",
};
const NOT_CHARGED: ResultView = { tone: "danger", title: "pay.notCharged", canRetry: true };

// Only a refusal from the server proves nothing was charged; other failures say what happened.
const ERROR_VIEWS: Record<string, ResultView> = {
  network: LOAD_FAILED,
  timeout: LOAD_FAILED,
  unavailable: LOAD_FAILED,
  connection_dropped: LOAD_FAILED,
  not_found: { tone: "neutral", title: "pay.notFound", body: "pay.notFoundBody", canRetry: false },
  forbidden: {
    tone: "neutral",
    title: "pay.forbidden",
    body: "pay.forbiddenBody",
    canRetry: false,
  },
  intent_conflict: { tone: "pending", title: "pay.intentConflict", body: "pay.intentConflictBody" },
  session_expired: SIGNED_OUT,
  unauthorized: SIGNED_OUT,
};

export function resultFor(state: PayState): ResultView | null {
  switch (state.tag) {
    case "loading":
      return state.resuming ? CHECKING : null;
    case "submitting":
      return CHECKING;
    case "checking":
      return state.slow ? { ...CHECKING, body: "pay.slow" } : CHECKING;
    case "confirmed":
      return { tone: "success", title: "pay.confirmed", body: "pay.confirmedBody" };
    case "declined":
      return { tone: "danger", title: "pay.declined", body: "pay.declinedBody", canRetry: true };
    case "expired":
      return { tone: "neutral", title: "pay.expired", body: "pay.expiredBody" };
    case "already_paid":
      return { tone: "neutral", title: "pay.alreadyPaid" };
    case "blocked":
      return state.reason === "paused"
        ? { tone: "neutral", title: "pay.paused", body: "pay.pausedBody" }
        : { tone: "neutral", title: "pay.update", body: "pay.updateBody" };
    case "error":
      return ERROR_VIEWS[state.code] ?? NOT_CHARGED;
    default:
      return null;
  }
}
