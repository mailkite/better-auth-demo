/**
 * Schema-generation config for `@better-auth/cli generate` only. Never imported by the app.
 *
 * The real instance in src/lib/auth.ts is built lazily, because the D1 binding only
 * exists per-request — and the CLI needs a static `auth` export it can read.
 *
 * It generates against a throwaway local SQLite file rather than D1. The CLI
 * introspects the database to diff what already exists, so a stub binding fails; and
 * D1 *is* SQLite, so the emitted schema is byte-for-byte what D1 needs.
 *
 * Keep the plugin list in step with src/lib/auth.ts or the generated schema will drift
 * from what the app actually needs.
 */
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { emailOTP, magicLink, organization } from "better-auth/plugins";
import { mailkite } from "@mailkite/better-auth";
import { mailkiteInbox } from "@mailkite/better-auth-inbox";

const mk = mailkite({
  apiKey: "mk_live_schema_generation_only",
  from: "hello@auth.mailk.us",
  appName: "Mainline",
  appUrl: "https://better-auth.mailkite.dev",
});

export const auth = betterAuth({
  database: new Database(".schema-gen.sqlite"),
  secret: "schema-generation-only-secret-at-least-32-chars",
  emailAndPassword: { enabled: true },
  plugins: [
    mk,
    magicLink({ sendMagicLink: mk.sendMagicLink }),
    emailOTP({ sendVerificationOTP: mk.sendVerificationOTP }),
    organization({ sendInvitationEmail: mk.sendInvitationEmail }),
    mailkiteInbox({
      apiKey: "mk_live_schema_generation_only",
      domain: "auth.mailk.us",
      webhookSecret: "schema-generation-only",
      baseURL: "https://better-auth.mailkite.dev",
    }),
  ],
});

export default auth;
