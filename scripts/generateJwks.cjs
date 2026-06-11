const { generateKeyPair, exportPKCS8 } = require("jose");
const { execSync } = require("child_process");

async function main() {
  // Generate RSA key pair
  const { privateKey } = await generateKeyPair("RS256");
  
  // Export as PKCS#8 PEM
  const pem = await exportPKCS8(privateKey);
  console.log("Generated PEM key (" + pem.length + " chars)");
  
  // Set it as Convex env var using the CLI
  // Use stdin to avoid shell escaping issues with newlines
  const { writeFileSync } = require("fs");
  writeFileSync("/tmp/jwt_key.pem", pem);
  
  try {
    // Try using file content
    const result = execSync(
      `npx convex env set JWT_PRIVATE_KEY "$(cat /tmp/jwt_key.pem)"`,
      { env: { ...process.env }, stdio: ["pipe", "pipe", "pipe"] }
    );
    console.log("JWT_PRIVATE_KEY set: " + result.toString().trim());
  } catch (e) {
    console.error("Error setting via shell:", e.stderr?.toString());
    // Fallback: try with escaped newlines
    const escaped = pem.replace(/\n/g, "\\n");
    try {
      const result2 = execSync(
        `npx convex env set JWT_PRIVATE_KEY '${pem.replace(/'/g, "'\''")}'`,
        { env: { ...process.env }, stdio: ["pipe", "pipe", "pipe"] }
      );
      console.log("JWT_PRIVATE_KEY set (fallback): " + result2.toString().trim());
    } catch (e2) {
      console.error("Fallback also failed:", e2.stderr?.toString());
    }
  }
}

main().catch(console.error);
