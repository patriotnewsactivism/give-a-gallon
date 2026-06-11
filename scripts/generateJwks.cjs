const { generateKeyPair, exportPKCS8 } = require("jose");

async function main() {
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) {
    console.error("CONVEX_DEPLOY_KEY not set");
    process.exit(1);
  }

  // Generate RSA key pair and export as PKCS8 PEM
  const { privateKey } = await generateKeyPair("RS256");
  const pem = await exportPKCS8(privateKey);
  console.log("Generated PEM key (" + pem.length + " chars)");

  // Try multiple Convex admin API endpoints
  const adminUrl = "https://api.convex.dev";
  const deploymentUrl = "https://ardent-schnauzer-537.convex.cloud";
  const authHeader = "Convex " + deployKey;

  // Approach 1: Try the admin API
  const endpoints = [
    { 
      url: adminUrl + "/api/deploy2/set_environment_variable",
      body: { name: "JWT_PRIVATE_KEY", value: pem }
    },
    {
      url: adminUrl + "/api/deployment/set_environment_variable",
      body: { name: "JWT_PRIVATE_KEY", value: pem }
    },
    {
      url: deploymentUrl + "/api/set_environment_variable",
      body: { name: "JWT_PRIVATE_KEY", value: pem }
    },
    {
      url: adminUrl + "/api/deploy2/update_environment_variables",
      body: { changes: [{ name: "JWT_PRIVATE_KEY", value: pem }] }
    },
  ];

  for (const ep of endpoints) {
    try {
      console.log("Trying:", ep.url);
      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "Convex-Client": "actions-1.0",
        },
        body: JSON.stringify(ep.body),
      });
      const text = await res.text();
      console.log("  Status:", res.status, "Body:", text.slice(0, 200));
      if (res.ok) {
        console.log("  SUCCESS!");
        return;
      }
    } catch (e) {
      console.error("  Error:", e.message);
    }
  }
  
  console.error("All endpoints failed");
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
