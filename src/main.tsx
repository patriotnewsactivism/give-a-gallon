import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  // Show a visible error instead of a black screen when env var is missing
  document.getElementById("root")!.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#ef4444;font-family:sans-serif;flex-direction:column;gap:16px;padding:24px;text-align:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h2 style="margin:0;font-size:1.25rem;">Missing VITE_CONVEX_URL</h2>
      <p style="margin:0;color:#9ca3af;max-width:400px;">Set the <code style="background:#1f2937;padding:2px 6px;border-radius:4px;">VITE_CONVEX_URL</code> environment variable in your Vercel project settings and redeploy.</p>
    </div>
  `;
} else {
  const convex = new ConvexReactClient(convexUrl);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexAuthProvider>
    </StrictMode>,
  );
}
