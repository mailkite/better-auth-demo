/**
 * Better Auth wired to MailKite, both directions.
 *
 *   @mailkite/better-auth        — sends verification, reset, magic-link and OTP mail
 *   @mailkite/better-auth-inbox  — receives mail back, per user or per organization
 *
 * This is the whole integration. It is deliberately not abstracted: the point of the
 * demo is that you can read the real wiring in one screen.
 */
import { betterAuth } from "better-auth";
import { emailOTP, magicLink, organization } from "better-auth/plugins";
import { mailkite } from "@mailkite/better-auth";
import { mailkiteInbox } from "@mailkite/better-auth-inbox";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import { getCloudflareContext } from "@opennextjs/cloudflare";

// Imported rather than relying on the global from `wrangler types`: putting
// @cloudflare/workers-types into compilerOptions.types shadows the DOM/Node globals
// that the Next.js pages in this same project need.
import type { D1Database } from "@cloudflare/workers-types";

type Env = {
  DB: D1Database;
  MAILKITE_API_KEY: string;
  MAILKITE_WEBHOOK_SECRET: string;
  BETTER_AUTH_SECRET: string;
  APP_URL?: string;
  MAIL_FROM?: string;
  MAIL_DOMAIN?: string;
};

function build(env: Env) {
  const appUrl = env.APP_URL ?? "https://better-auth.mailkite.dev";
  const from = env.MAIL_FROM ?? "hello@auth.mailk.us";

  // One MailKite instance serves every outbound surface. It IS a Better Auth plugin —
  // dropping it into `plugins` wires sendVerificationEmail and sendResetPassword via
  // its init(); the other three are read from their own plugin's closure, so they get
  // passed by hand off the same object.
  const mk = mailkite({
    apiKey: env.MAILKITE_API_KEY,
    from,
    appName: "Mainline",
    appUrl,
    brandColor: "#2f6fe0",
    onError: (err, meta) => console.error("[mailkite]", meta.type, err),
  });

  const db = new Kysely<Record<string, never>>({
    dialect: new D1Dialect({ database: env.DB }),
  });

  return betterAuth({
    database: { db, type: "sqlite" },
    baseURL: appUrl,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      // No reset callback here on purpose — the mailkite plugin supplies it.
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
    },
    plugins: [
      mk,
      magicLink({ sendMagicLink: mk.sendMagicLink }),
      emailOTP({ sendVerificationOTP: mk.sendVerificationOTP }),
      organization({ sendInvitationEmail: mk.sendInvitationEmail }),
      mailkiteInbox({
        apiKey: env.MAILKITE_API_KEY,
        domain: env.MAIL_DOMAIN ?? "auth.mailk.us",
        webhookSecret: env.MAILKITE_WEBHOOK_SECRET,
        baseURL: appUrl,
      }),
    ],
  });
}

// The D1 binding only exists per-request, so the instance is built lazily and then
// memoized for the lifetime of the isolate.
let cached: ReturnType<typeof build> | undefined;

export function getAuth() {
  if (!cached) {
    const { env } = getCloudflareContext();
    cached = build(env as unknown as Env);
  }
  return cached;
}

export type Auth = ReturnType<typeof build>;
