const { generateKeyPair, exportJWK } = require("jose");

async function main() {
  const { privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(privateKey);
  jwk.use = "sig";
  jwk.kid = "convex-auth-key-1";
  jwk.alg = "RS256";
  const jwks = JSON.stringify({ keys: [jwk] });
  // Output just the JWKS JSON
  console.log(jwks);
}

main().catch(console.error);
