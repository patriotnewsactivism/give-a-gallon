const { generateKeyPair, exportPKCS8, exportJWK } = require("jose");
const { execFileSync } = require("child_process");
const path = require("path");

async function main() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  
  const pem = await exportPKCS8(privateKey);
  console.log("Generated PEM key (" + pem.length + " chars)");
  
  // Base64 encode the PEM so it has no newlines or dashes
  const pemB64 = Buffer.from(pem).toString("base64");
  console.log("Base64 encoded (" + pemB64.length + " chars, no newlines/dashes)");
  
  // Export JWKS (public key)
  const jwk = await exportJWK(publicKey);
  jwk.use = "sig";
  jwk.kid = "convex-auth-key-1";
  jwk.alg = "RS256";
  const jwks = JSON.stringify({ keys: [jwk] });
  console.log("Generated JWKS (" + jwks.length + " chars)");
  
  const convexBin = path.resolve("node_modules/.bin/convex");
  
  // Set JWT_PRIVATE_KEY_B64 (safe, no special chars)
  try {
    const r1 = execFileSync(convexBin, ["env", "set", "JWT_PRIVATE_KEY_B64", pemB64], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("JWT_PRIVATE_KEY_B64: " + r1.toString().trim());
  } catch (e) {
    console.error("JWT_PRIVATE_KEY_B64 failed:", e.stderr?.toString().trim());
  }
  
  // Set JWKS
  try {
    const r2 = execFileSync(convexBin, ["env", "set", "JWKS", jwks], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("JWKS: " + r2.toString().trim());
  } catch (e) {
    console.error("JWKS failed:", e.stderr?.toString().trim());
  }
}

main().catch(e => { console.error(e); process.exit(1); });
