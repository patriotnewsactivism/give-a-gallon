const { generateKeyPair, exportPKCS8, exportJWK } = require("jose");
const { execFileSync } = require("child_process");
const path = require("path");

async function main() {
  // Generate RSA key pair
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  
  // Export PKCS8 PEM
  const pem = await exportPKCS8(privateKey);
  console.log("Generated PEM key (" + pem.length + " chars)");
  
  // Export JWKS (public key)
  const jwk = await exportJWK(publicKey);
  jwk.use = "sig";
  jwk.kid = "convex-auth-key-1";
  jwk.alg = "RS256";
  const jwks = JSON.stringify({ keys: [jwk] });
  console.log("Generated JWKS (" + jwks.length + " chars)");
  
  // Find the convex binary
  const convexBin = path.resolve("node_modules/.bin/convex");
  
  // Set JWT_PRIVATE_KEY using execFileSync (no shell, direct argv)
  try {
    const result1 = execFileSync(convexBin, ["env", "set", "JWT_PRIVATE_KEY", pem], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("JWT_PRIVATE_KEY: " + result1.toString().trim());
  } catch (e) {
    console.error("JWT_PRIVATE_KEY failed:", e.stderr?.toString().trim());
  }
  
  // Set JWKS using execFileSync
  try {
    const result2 = execFileSync(convexBin, ["env", "set", "JWKS", jwks], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("JWKS: " + result2.toString().trim());
  } catch (e) {
    console.error("JWKS failed:", e.stderr?.toString().trim());
  }
}

main().catch(e => { console.error(e); process.exit(1); });
