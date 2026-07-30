# Better Auth + MailKite — live demo

**<https://better-auth.mailkite.dev>**

The [shadcnblocks Mainline](https://github.com/shadcnblocks/mainline-nextjs-template)
template with real authentication wired to MailKite, both directions:

| | |
|---|---|
| [`@mailkite/better-auth`](https://www.npmjs.com/package/@mailkite/better-auth) | sends verification, password reset, magic links, email OTP, org invites |
| [`@mailkite/better-auth-inbox`](https://www.npmjs.com/package/@mailkite/better-auth-inbox) | **receives** mail back — the half no auth library has |

Next.js 15 on Cloudflare Workers (via OpenNext), Better Auth on D1.

## What to try

- `/signup` — creates an account; the verification email is sent by the plugin, with no
  callback written by hand.
- `/login` — magic link, email OTP, or password. All three emails come from MailKite.
- `/inbox` — claim a real address, email it, and watch it arrive. Reply from the app.

## The whole integration

Everything is in [`src/lib/auth.ts`](src/lib/auth.ts) — deliberately unabstracted so the
wiring is readable in one screen.

```ts
const mk = mailkite({
  apiKey: env.MAILKITE_API_KEY,
  from: "better-auth@auth.mailkite.dev",
  appName: "Mainline",
  appUrl,
  // REQUIRED on serverless. Sends are dispatched without being awaited so response
  // time can't leak whether an account exists — but a Worker is torn down the moment
  // it responds, so an unregistered background promise is simply killed and the mail
  // silently never sends. This keeps the isolate alive off the critical path.
  waitUntil: (p) => getCloudflareContext().ctx.waitUntil(p),
});

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  plugins: [
    mk,                                                 // verification + reset, automatic
    magicLink({ sendMagicLink: mk.sendMagicLink }),
    emailOTP({ sendVerificationOTP: mk.sendVerificationOTP }),
    organization({ sendInvitationEmail: mk.sendInvitationEmail }),
    mailkiteInbox({ apiKey, domain, webhookSecret, baseURL }),
  ],
});
```

`mk` is both the plugin and the source of the three callbacks that Better Auth only
accepts by hand — `magicLink`, `emailOTP` and `organization` read theirs from their own
closure, so no plugin can inject them.

## Why this demo exists

It was built to check the packages before submitting them to Better Auth's community
plugin directory. It found four real bugs that unit tests had missed, every one of them
because a test asserted what the implementation did instead of what the API actually
does:

1. `provision` sent `{address, target}` to `POST /api/routes`; the API requires
   `{match, destination}` and 400s otherwise.
2. The webhook looked for an `x-mailkite-timestamp` header that has never existed —
   MailKite sends one combined `x-mailkite-signature: t=<ms>,v1=<hex>`. Every delivery
   was rejected 401.
3. The replay window compared a millisecond timestamp against seconds.
4. The payload parser expected `from`/`to` as strings; MailKite sends address objects
   and an array, per the published `email-received-event.json` schema. Every delivery
   that survived signature checking was then rejected 400.

Fixed in `@mailkite/better-auth-inbox@0.2.1`.

## Running it yourself

```bash
npm install
npx wrangler d1 create better-auth-demo      # then put the id in wrangler.jsonc
npx @better-auth/cli generate --config better-auth.config.ts --output schema.sql -y
npx wrangler d1 execute better-auth-demo --remote --file schema.sql
npm run deploy
```

Secrets (`wrangler secret put`): `MAILKITE_API_KEY`, `MAILKITE_WEBHOOK_SECRET`,
`BETTER_AUTH_SECRET`, `APP_URL`, `MAIL_FROM`, `MAIL_DOMAIN`.

Point your domain's webhook at `<APP_URL>/api/auth/mailkite/inbox/webhook`.

## Licence

The template is © Shadcnblocks.com under its own licence — see [LICENSE](LICENSE).
The MailKite/Better Auth integration code is MIT.
