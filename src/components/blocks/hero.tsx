import Link from "next/link";

import { ArrowRight, Inbox, KeyRound, Reply, ShieldCheck } from "lucide-react";

import { DashedLine } from "@/components/dashed-line";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Every auth email, sent",
    description:
      "Verification, password reset, magic links, OTPs and org invites — all five surfaces.",
    icon: KeyRound,
  },
  {
    title: "A real mailbox, received",
    description:
      "Claim an address, get mail as a signature-verified webhook, read it in-app.",
    icon: Inbox,
  },
  {
    title: "Reply from the app",
    description:
      "Answers go out from the address that received them, threaded to the original.",
    icon: Reply,
  },
  {
    title: "No API key in the browser",
    description:
      "Every inbox call is session-scoped against your own auth server.",
    icon: ShieldCheck,
  },
];

const snippet = `import { betterAuth } from "better-auth";
import { emailOTP, magicLink } from "better-auth/plugins";
import { mailkite } from "@mailkite/better-auth";
import { mailkiteInbox } from "@mailkite/better-auth-inbox";

// apiKey is required on both plugins — there is no environment fallback.
const apiKey = process.env.MAILKITE_API_KEY!;

const mk = mailkite({ apiKey, from: "auth@yourdomain.com", appName: "Acme" });

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  plugins: [
    mk,                                    // verification + reset, wired for you
    magicLink({ sendMagicLink: mk.sendMagicLink }),
    emailOTP({ sendVerificationOTP: mk.sendVerificationOTP }),
    mailkiteInbox({
      apiKey,                                  // the same key, declared once
      domain: "yourdomain.com",
      webhookSecret: process.env.MAILKITE_WEBHOOK_SECRET!,
    }),
  ],
});`;

export const Hero = () => {
  return (
    <section className="py-28 lg:py-32 lg:pt-44">
      <div className="container flex flex-col justify-between gap-8 md:gap-14 lg:flex-row lg:gap-20">
        {/* Left side - Main content */}
        <div className="flex-1">
          <p className="text-muted-foreground mb-4 text-sm font-medium">
            A working demo · Better Auth + MailKite
          </p>
          <h1 className="text-foreground max-w-160 text-3xl tracking-tight md:text-4xl lg:text-5xl">
            Better Auth sends the email. Now it can receive it too.
          </h1>

          <p className="text-muted-foreground mt-5 max-w-xl text-lg md:text-xl">
            Two plugins. One sends every transactional email Better Auth
            generates; the other gives your app a real mailbox — the half no auth
            library offers. Everything on this site is live, not a screenshot.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 lg:flex-nowrap">
            <Button asChild>
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button
              variant="outline"
              className="from-background h-auto gap-2 bg-linear-to-r to-transparent shadow-md"
              asChild
            >
              <Link href="/inbox" className="max-w-56 truncate text-start md:max-w-none">
                Try the inbox
                <ArrowRight className="stroke-3" />
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-4 text-sm">
            Real emails are sent. Use an address you can actually check.
          </p>
        </div>

        {/* Right side - Features */}
        <div className="relative flex flex-1 flex-col justify-center space-y-5 max-lg:pt-10 lg:pl-10">
          <DashedLine
            orientation="vertical"
            className="absolute top-0 left-0 max-lg:hidden"
          />
          <DashedLine
            orientation="horizontal"
            className="absolute top-0 lg:hidden"
          />
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-2.5 lg:gap-5">
                <Icon className="text-foreground mt-1 size-4 shrink-0 lg:size-5" />
                <div>
                  <h2 className="font-text text-foreground font-semibold">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground max-w-76 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The integration itself, in place of the template's product screenshot —
          the code IS the thing being demonstrated. */}
      <div className="mt-12 md:mt-20 lg:container lg:mt-24">
        <div className="bg-muted/50 overflow-x-auto rounded-2xl border p-5 shadow-lg md:p-8">
          <p className="text-muted-foreground mb-4 font-mono text-xs">
            lib/auth.ts — the whole integration
          </p>
          <pre className="text-foreground font-mono text-[13px] leading-relaxed">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
