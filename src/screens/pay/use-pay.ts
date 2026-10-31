import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { ApiError } from "@/api/errors";
import { formatCents, secondsLeft, withinBudget } from "@/core";
import { useT } from "@/hooks/use-t";
import { clock } from "@/api/api-instance";
import { getOrder } from "@/api/orders";
import { intents } from "@/lib/intents";
import { orderVersions } from "@/lib/versions";
import { useAppGate } from "@/screens/gate/use-app-gate";
import { useSessionStore } from "@/stores/session-store";

import { authenticateWithDevice, deviceCanAuthenticate } from "./confirm-auth";
import { payReducer } from "./pay-machine";
import { usePayAnnouncements } from "./use-pay-announcements";
import { usePaymentOutcome } from "./use-payment-outcome";

const TICK_MS = 1000;
const LOAD_RETRY_MS = 3000;
// The server enforces both switches, so a slow config read must not hold up paying.
const GATE_BUDGET_MS = 3000;

export function usePay(orderId: string) {
  const { t, locale } = useT();
  const username = useSessionStore((s) => s.savedUsername);
  const { recheck } = useAppGate();

  const confirmingRef = useRef(false);
  const reloadRef = useRef<() => void>(() => undefined);

  const [state, dispatch] = useReducer(payReducer, { tag: "loading" });
  const [nowMs, setNowMs] = useState(() => clock.now());
  const [pinVisible, setPinVisible] = useState(false);

  const order = "order" in state ? state.order : undefined;
  const seconds = order ? secondsLeft(order, nowMs) : 0;
  const amount = order?.amountCents != null ? formatCents(order.amountCents, locale) : "";

  const load = useCallback(async () => {
    try {
      const loaded = orderVersions.keep(await getOrder(orderId));
      const intent = intents.get(orderId);
      const mine = intent && intent.username === username ? intent : undefined;
      dispatch({ type: "order_loaded", order: loaded, intent: mine, nowMs: clock.now() });
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "unexpected";
      const intentLive = Boolean(intents.get(orderId));
      dispatch({ type: "load_failed", code, intentLive });
      if (intentLive) setTimeout(() => reloadRef.current(), LOAD_RETRY_MS);
    }
  }, [orderId, username]);

  const submit = useCallback(() => {
    setPinVisible(false);
    if (!order || order.amountCents == null || !username) return;
    const now = clock.now();
    if (secondsLeft(order, now) === 0) return dispatch({ type: "tick", nowMs: now });
    try {
      const intent = intents.start(order.id, order.amountCents, username, Crypto.randomUUID);
      dispatch({ type: "auth_ok", intent, nowMs: now });
    } catch {
      dispatch({ type: "failed", code: "intent_conflict" });
    }
  }, [order, username]);

  const cancelAuth = useCallback(() => {
    setPinVisible(false);
    dispatch({ type: "auth_cancelled" });
  }, []);

  const confirm = useCallback(async () => {
    if (confirmingRef.current || state.tag !== "review") return;
    const now = clock.now();
    dispatch({ type: "confirm_tapped", nowMs: now });
    if (state.order.status !== "open" || secondsLeft(state.order, now) === 0) return;
    confirmingRef.current = true;
    try {
      const gate = await withinBudget(recheck(), GATE_BUDGET_MS, "ok");
      if (gate === "paused" || gate === "update_required") {
        return dispatch({ type: "blocked", reason: gate });
      }
      if (!(await deviceCanAuthenticate())) return setPinVisible(true);
      const prompt = t("pay.authPrompt", { amount, mensa: state.order.mensa.name });
      const result = await authenticateWithDevice(prompt, t("common.cancel"));
      if (result === "ok") submit();
      else cancelAuth();
    } finally {
      confirmingRef.current = false;
    }
  }, [amount, cancelAuth, recheck, state, submit, t]);

  const retry = useCallback(() => dispatch({ type: "retry" }), []);

  usePaymentOutcome(state, dispatch);
  usePayAnnouncements(state, amount, seconds);

  useEffect(() => {
    let live = true;
    reloadRef.current = () => live && void load();
    return () => {
      live = false;
    };
  }, [load]);

  useEffect(() => {
    if (state.tag === "loading") void load();
  }, [state.tag, load]);

  useEffect(() => {
    if (state.tag !== "review" && state.tag !== "authenticating") setPinVisible(false);
  }, [state.tag]);

  useEffect(() => {
    if (state.tag !== "review" && state.tag !== "authenticating") return;
    const timer = setInterval(() => {
      const now = clock.now();
      setNowMs(now);
      dispatch({ type: "tick", nowMs: now });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [state.tag]);

  return { state, seconds, amount, pinVisible, confirm, submit, cancelAuth, retry };
}
