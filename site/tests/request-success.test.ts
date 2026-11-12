import { afterEach, describe, expect, it, vi } from "vitest";
import { isDeliveryReceipt, reportRequestSuccess } from "../apps/web/request-success";

afterEach(() => vi.unstubAllGlobals());
describe("confirmed mail and Telegram conversion", () => {
  it("does not report failures, unconfirmed success or malformed responses", () => {
    const ym = vi.fn(); vi.stubGlobal("window", { ym });
    for (const value of [null, {}, { ok: false }, { ok: true, id: "ABC1234567", delivery: "smtp_accepted" }, { ok: true, id: "ABC1234567" },
      { ok: "true", id: "ABC1234567", delivery: "smtp_telegram_accepted" },
      { ok: true, id: "", delivery: "smtp_telegram_accepted" },
      { ok: true, id: "ABC1234567", delivery: "queued" }]) {
      expect(isDeliveryReceipt(value)).toBe(false);
      reportRequestSuccess(value);
    }
    expect(ym).not.toHaveBeenCalled();
  });
  it("reports accepted mail and Telegram once per receipt without contact data", () => {
    const ym = vi.fn(); vi.stubGlobal("window", { ym });
    const receipt = { ok: true, id: "ABC1234567", delivery: "smtp_telegram_accepted" };
    expect(isDeliveryReceipt(receipt)).toBe(true);
    reportRequestSuccess(receipt); reportRequestSuccess(receipt);
    expect(ym.mock.calls).toEqual([[114134772, "reachGoal", "request_sent"]]);
    reportRequestSuccess({ ...receipt, id: "ABC1234568" });
    expect(ym).toHaveBeenCalledTimes(2);
  });
  it("does not break form success when analytics is blocked or throws", () => {
    const receipt = { ok: true, id: "ABC1234569", delivery: "smtp_telegram_accepted" };
    vi.stubGlobal("window", {});
    expect(() => reportRequestSuccess(receipt)).not.toThrow();
    vi.stubGlobal("window", { ym: () => { throw Error("blocked"); } });
    expect(() => reportRequestSuccess(receipt)).not.toThrow();
  });
});
