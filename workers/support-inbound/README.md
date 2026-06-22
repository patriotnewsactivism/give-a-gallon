# Support inbound email worker

Closes the loop so the AI support assistant handles **ongoing email replies** to
`support@giveagallon.org`, not just the first contact from the web form.

```
Email to support@giveagallon.org
        │  (Cloudflare Email Routing)
        ▼
  this Worker  ──POST {from,name,subject,body}──▶  Convex /support-inbound
        │                                                  │
        └─(optional) forward copy to a human inbox         ▼
                                              AI assistant replies from support@
```

## One-time setup

### 1. Set the shared secret on the Convex side
Pick any long random string and set it on the **prod** deployment:

```bash
npx convex env set SUPPORT_INBOUND_SECRET "$(openssl rand -hex 32)" --prod
```

Copy that value — you'll reuse it in step 3.

### 2. Point the worker at your Convex deployment
Edit `wrangler.toml` → `CONVEX_SUPPORT_URL`. Use your **prod** Convex HTTP
actions host (the `*.convex.site` domain, found in the Convex dashboard under
Settings → URL & Deploy Key → "HTTP Actions URL"), with the `/support-inbound`
path. The default points at `aware-sandpiper-557.convex.site`.

### 3. Deploy the worker and set its secret
```bash
cd workers/support-inbound
npm install
npx wrangler secret put SUPPORT_INBOUND_SECRET   # paste the same value from step 1
npx wrangler deploy
```

### 4. Route the address to the worker
In the Cloudflare dashboard → **giveagallon.org → Email → Email Routing**:
- Enable Email Routing if you haven't (accept the auto-added MX + SPF records;
  remember to **merge** SPF with Resend's existing record — only one SPF TXT is
  allowed).
- Under **Routing rules**, add a custom address `support@giveagallon.org` with
  action **Send to a Worker → giveagallon-support-inbound**.

(Optional) set `FORWARD_TO` in `wrangler.toml` to also drop a copy in a human
inbox; the destination must be a Cloudflare-verified address.

## Test
Email `support@giveagallon.org` from any account. Within a few seconds the AI
assistant should reply from `support@giveagallon.org`, and the new message +
reply appear in Convex (`supportTickets` / `supportMessages`). Tail logs with
`npx wrangler tail` and `npx convex logs --prod`.
