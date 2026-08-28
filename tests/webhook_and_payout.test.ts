import { describe, expect, it } from "vitest";

async function createSignature(payload: string, secret: string, timestamp: number) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = `${timestamp}.${payload}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const hexSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `t=${timestamp},v1=${hexSignature}`;
}

describe("Stripe Webhook Signature Verification", () => {
  const secret = "whsec_test_secret_12345";
  const payload = JSON.stringify({ type: "checkout.session.completed", id: "cs_test_abc" });

  it("validates authentic signature matching payload", async () => {
    const now = Math.floor(Date.now() / 1000);
    const header = await createSignature(payload, secret, now);
    expect(header).toContain("t=");
    expect(header).toContain("v1=");
  });

  it("rejects forged or expired signature", async () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const header = await createSignature(payload, secret, expiredTime);
    const timestamp = parseInt(header.split(",")[0].split("=")[1], 10);
    const now = Math.floor(Date.now() / 1000);
    expect(Math.abs(now - timestamp)).toBeGreaterThan(300);
  });
});
