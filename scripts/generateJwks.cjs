const { generateKeyPair, exportPKCS8 } = require("jose");

async function main() {
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) {
    console.error("CONVEX_DEPLOY_KEY not set");
    process.exit(1);
  }

  // Step 1: Get the deployment URL from the deploy key
  const urlRes = await fetch("https://api.convex.dev/api/deployment/url_for_key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deployKey }),
  });
  const { url: deploymentUrl } = await urlRes.json();
  console.log("Deployment URL:", deploymentUrl);

  // Step 2: Generate RSA key pair and export as PKCS8 PEM
  const { privateKey } = await generateKeyPair("RS256");
  const pem = await exportPKCS8(privateKey);
  console.log("Generated PEM key (" + pem.length + " chars)");

  // Step 3: Check if JWT_PRIVATE_KEY already exists
  const listRes = await fetch(deploymentUrl + "/api/environment_variables", {
    method: "GET",
    headers: { 
      "Authorization": "Convex " + deployKey,
      "Content-Type": "application/json"
    },
  });
  
  if (listRes.ok) {
    const envVars = await listRes.json();
    console.log("Current env vars:", envVars.map(v => v.name).join(", "));
    
    // Check if JWT_PRIVATE_KEY already has a valid PEM
    const existing = envVars.find(v => v.name === "JWT_PRIVATE_KEY");
    if (existing && existing.value && existing.value.includes("BEGIN PRIVATE KEY")) {
      console.log("JWT_PRIVATE_KEY already set with valid PEM, skipping");
      return;
    }
  }

  // Step 4: Set the env var via Convex API  
  const setRes = await fetch(deploymentUrl + "/api/environment_variables", {
    method: "POST",
    headers: {
      "Authorization": "Convex " + deployKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "JWT_PRIVATE_KEY",
      value: pem,
    }),
  });
  
  if (setRes.ok) {
    console.log("JWT_PRIVATE_KEY set successfully via API!");
  } else {
    const errText = await setRes.text();
    console.error("Failed to set via environment_variables API:", setRes.status, errText);
    
    // Try the update endpoint
    const updateRes = await fetch(deploymentUrl + "/api/update_environment_variables", {
      method: "POST",
      headers: {
        "Authorization": "Convex " + deployKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        changes: [{ name: "JWT_PRIVATE_KEY", value: pem }],
      }),
    });
    
    if (updateRes.ok) {
      console.log("JWT_PRIVATE_KEY set via update API!");
    } else {
      console.error("Update also failed:", updateRes.status, await updateRes.text());
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
