import { action } from "./_generated/server";

export const testCrypto = action({
  args: {},
  handler: async () => {
    const results: string[] = [];
    
    // Check crypto global
    results.push("crypto exists: " + (typeof crypto !== "undefined"));
    results.push("crypto.subtle exists: " + (typeof crypto?.subtle !== "undefined"));
    results.push("crypto.getRandomValues exists: " + (typeof crypto?.getRandomValues !== "undefined"));
    
    // Try getRandomValues
    try {
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      results.push("getRandomValues: OK");
    } catch (e: any) {
      results.push("getRandomValues: " + e.message);
    }
    
    // Try subtle.importKey
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode("test"), "PBKDF2", false, ["deriveBits"]);
      results.push("importKey PBKDF2: OK");
    } catch (e: any) {
      results.push("importKey PBKDF2: " + e.message);
    }
    
    // Try subtle.digest (SHA-256)
    try {
      const enc = new TextEncoder();
      const hash = await crypto.subtle.digest("SHA-256", enc.encode("test"));
      results.push("digest SHA-256: OK, length=" + hash.byteLength);
    } catch (e: any) {
      results.push("digest SHA-256: " + e.message);
    }
    
    // Try deriveBits
    try {
      const enc = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await crypto.subtle.importKey("raw", enc.encode("test"), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({name: "PBKDF2", salt, iterations: 1000, hash: "SHA-256"}, key, 256);
      results.push("deriveBits PBKDF2: OK, length=" + bits.byteLength);
    } catch (e: any) {
      results.push("deriveBits PBKDF2: " + e.message);
    }
    
    return results;
  },
});
