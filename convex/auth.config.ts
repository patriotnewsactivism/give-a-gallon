export default {
  providers: [
    {
      // Use the deployment's own site URL (Convex injects CONVEX_SITE_URL into
      // every deployment) instead of a hardcoded domain. This keeps the JWT
      // issuer correct on whichever deployment runs the app — dev, preview, or
      // prod — so auth never breaks from a stale, hardcoded URL.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
