import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// The Convex deployment URL is public client configuration. Prefer a Vercel/Vite
// environment override when present, but keep the known production deployment as
// a safe fallback so a missing dashboard variable cannot take the site offline.
const convexUrl =
  (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim() ||
  "https://aware-sandpiper-557.convex.cloud";

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
