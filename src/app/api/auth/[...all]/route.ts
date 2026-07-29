/**
 * Better Auth's catch-all handler. Everything the plugins add lives under here too:
 * the inbox endpoints are /api/auth/mailkite/inbox/*, and the inbound webhook
 * MailKite POSTs to is /api/auth/mailkite/inbox/webhook.
 */
import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

// The D1 binding is per-request, so resolve the handler per-request too.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
