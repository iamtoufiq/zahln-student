import type { Payment } from "@/api/payments/interface";
import type { Tone } from "@/ui";

const TONES: Record<Payment["status"], Tone> = {
  pending: "pending",
  confirmed: "success",
  declined: "danger",
};

export const toneFor = (status: Payment["status"]): Tone => TONES[status];
