/**
 * AiSensy WhatsApp gateway — hermetic e2e for notifyOwnerWhatsApp().
 * No DB / no network needed: @/lib/db is mocked (SiteSetting reader) and
 * global fetch is intercepted, so the REAL transport code in
 * src/lib/booking-sync.ts is exercised end-to-end.
 *
 * Verifies: correct AiSensy endpoint + payload shape (apiKey, campaignName,
 * destination, userName, templateParams[0] = alert text with *bold* markers
 * stripped), success/failure handling, config guards, and that the three
 * existing gateways (callmebot / ultramsg / greenapi) still behave.
 *
 * Run: bun test scripts/aisensy.test.ts
 */
import { test, expect, beforeEach, mock } from "bun:test";

type Call = { url: string; init: any };
const calls: Call[] = [];
let responder: (url: string) => { status: number; body: any } = () => ({
  status: 200,
  body: { success: true },
});
let SETTINGS: Record<string, string> = {};

// Mock the Prisma handle — only siteSetting.findMany is used by the notify path.
mock.module("@/lib/db", () => ({
  db: {
    siteSetting: {
      findMany: async (args: any) => {
        const keys: string[] = args?.where?.key?.in ?? [];
        return keys
          .filter((k) => k in SETTINGS)
          .map((k) => ({ key: k, value: SETTINGS[k] }));
      },
    },
  },
}));

// Intercept every fetch (AiSensy / CallMeBot / UltraMsg / Green API all go through here).
globalThis.fetch = (async (url: any, init: any) => {
  const u = String(url?.url ?? url);
  calls.push({ url: u, init });
  const r = responder(u);
  return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

const { notifyOwnerWhatsApp } = await import("@/lib/booking-sync");

const base = (over: Record<string, string> = {}): Record<string, string> => ({
  whatsapp_enabled: "true",
  whatsapp_owner_phone: "919760814931",
  whatsapp_api_key: "AISENSY-KEY-123",
  whatsapp_provider: "aisensy",
  whatsapp_aisensy_campaign: "rk_alert",
  ...over,
});

beforeEach(() => {
  calls.length = 0;
  SETTINGS = {};
  responder = () => ({ status: 200, body: { success: true } });
});

test("aisensy happy path — correct endpoint + payload, returns true", async () => {
  SETTINGS = base();
  const ok = await notifyOwnerWhatsApp(
    "*NEW WEBSITE BOOKING — RK Residency*\nRef: RK-VRD-2026-1234\nGuest: Test Guest"
  );
  expect(ok).toBe(true);
  expect(calls.length).toBe(1);
  expect(calls[0].url).toBe("https://backend.aisensy.com/campaign/t1/api/v2");
  const body = JSON.parse(calls[0].init.body);
  expect(body.apiKey).toBe("AISENSY-KEY-123");
  expect(body.campaignName).toBe("rk_alert");
  expect(body.destination).toBe("919760814931");
  expect(body.userName).toBe("RK Residency Owner");
  expect(body.source).toBe("website-bookings");
  expect(Array.isArray(body.templateParams)).toBe(true);
  expect(body.templateParams[0]).toContain("RK-VRD-2026-1234");
  expect(body.templateParams[0]).not.toContain("*"); // WhatsApp bold markers stripped
});

test("aisensy 200 + success:false → false (e.g. campaign not found)", async () => {
  SETTINGS = base();
  responder = () => ({ status: 200, body: { success: false, message: "Campaign not found" } });
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
});

test("aisensy HTTP 401 → false (bad API key)", async () => {
  SETTINGS = base();
  responder = () => ({ status: 401, body: { message: "Unauthorized" } });
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
});

test("aisensy HTTP 500 → false", async () => {
  SETTINGS = base();
  responder = () => ({ status: 500, body: "boom" });
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
});

test("aisensy 200 without success field → true (docs: success = HTTP 200)", async () => {
  SETTINGS = base();
  responder = () => ({ status: 200, body: { campaignName: "rk_alert" } });
  expect(await notifyOwnerWhatsApp("test")).toBe(true);
});

test("aisensy selected but campaign missing → false, no HTTP call", async () => {
  SETTINGS = base({ whatsapp_aisensy_campaign: "" });
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
  expect(calls.length).toBe(0);
});

test("aisensy network failure → false, never throws", async () => {
  SETTINGS = base();
  responder = () => {
    throw new Error("ECONNREFUSED");
  };
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
});

test("provider unset → falls back to CallMeBot (existing default preserved)", async () => {
  SETTINGS = base({ whatsapp_provider: "" });
  expect(await notifyOwnerWhatsApp("test")).toBe(true);
  expect(calls[0].url).toContain("api.callmebot.com/whatsapp.php");
});

test("callmebot explicit still works (regression)", async () => {
  SETTINGS = base({ whatsapp_provider: "callmebot", whatsapp_api_key: "CB-KEY" });
  expect(await notifyOwnerWhatsApp("test")).toBe(true);
  expect(calls[0].url).toContain("apikey=CB-KEY");
});

test("ultramsg path untouched (regression)", async () => {
  SETTINGS = base({ whatsapp_provider: "ultramsg", whatsapp_ultramsg_instance: "instance99999" });
  responder = () => ({ status: 200, body: { sent: "true", id: "u1" } }); // UltraMsg replies sent:"true"
  expect(await notifyOwnerWhatsApp("test")).toBe(true);
  expect(calls[0].url).toBe("https://api.ultramsg.com/instance99999/messages/chat");
  const body = new URLSearchParams(calls[0].init.body);
  expect(body.get("token")).toBe("AISENSY-KEY-123");
  expect(body.get("to")).toBe("919760814931");
});

test("greenapi path untouched (regression)", async () => {
  SETTINGS = base({ whatsapp_provider: "greenapi", whatsapp_greenapi_instance: "111111" });
  responder = () => ({ status: 200, body: { idMessage: "abc123" } });
  expect(await notifyOwnerWhatsApp("test")).toBe(true);
  expect(calls[0].url).toBe("https://api.green-api.com/waInstance111111/sendMessage/AISENSY-KEY-123");
  const body = JSON.parse(calls[0].init.body);
  expect(body.chatId).toBe("919760814931@c.us");
});

test("whatsapp disabled → false, no HTTP call", async () => {
  SETTINGS = base({ whatsapp_enabled: "false" });
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
  expect(calls.length).toBe(0);
});

test("missing api key → false, no HTTP call", async () => {
  SETTINGS = base({ whatsapp_api_key: "" });
  expect(await notifyOwnerWhatsApp("test")).toBe(false);
  expect(calls.length).toBe(0);
});
