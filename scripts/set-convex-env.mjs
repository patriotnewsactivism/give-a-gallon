// Pre-build script: push env vars to Convex
import { execSync } from "child_process";

const envVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  // Use the env var if set, otherwise fall back to the real production domain.
  // Do NOT hardcode a stale URL here — it would override whatever is set in
  // the Convex dashboard on every deploy.
  SITE_URL: process.env.SITE_URL ?? "https://give.wtpnews.org",
};

for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    console.log(`Setting Convex env: ${key}...`);
    try {
      execSync(`npx convex env set ${key} "${value}"`, { stdio: "inherit" });
      console.log(`✓ ${key} set`);
    } catch (e) {
      console.error(`✗ Failed to set ${key}:`, e.message);
    }
  } else {
    console.log(`⚠ Skipping ${key} (not in environment)`);
  }
}
