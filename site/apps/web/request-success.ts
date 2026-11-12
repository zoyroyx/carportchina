type DeliveryReceipt = { ok: true; id: string; delivery: "smtp_telegram_accepted" };

export function isDeliveryReceipt(value: unknown): value is DeliveryReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Record<string, unknown>;
  return receipt.ok === true && receipt.delivery === "smtp_telegram_accepted" &&
    typeof receipt.id === "string" && /^[A-F0-9]{10}$/.test(receipt.id);
}

const reported = new Set<string>();
export function reportRequestSuccess(receipt: unknown): void {
  if (!isDeliveryReceipt(receipt) || typeof window === "undefined" || reported.has(receipt.id)) return;
  const ym = (window as unknown as { ym?: (counter: number, method: string, goal: string) => void }).ym;
  if (typeof ym !== "function") return;
  try {
    ym(114134772, "reachGoal", "request_sent");
    reported.add(receipt.id);
  } catch {
    // Analytics failure must never turn an accepted application into a failed form.
  }
}
