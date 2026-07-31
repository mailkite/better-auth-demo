import { ArrowDown } from "lucide-react";

import { DashedLine } from "../dashed-line";

import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "1",
    title: "You install two plugins",
    body: "@mailkite/better-auth is a real BetterAuthPlugin — dropping it into plugins wires sendVerificationEmail and sendResetPassword through its init(). Better Auth merges that with defu, so if you already set either callback, yours wins.",
  },
  {
    step: "2",
    title: "Better Auth calls them",
    body: "Sign up here and Better Auth generates a token and a URL, then calls the plugin. No callback written by hand. Magic link, email OTP and org invites read their callback from their own plugin's closure, so those get passed explicitly off the same object.",
  },
  {
    step: "3",
    title: "Sends are backgrounded on purpose",
    body: "Awaiting the send would make the response slower when an account exists, which leaks who has an account. The plugin dispatches and returns immediately; failures go to onError, never to the caller. On serverless you pass waitUntil so the runtime doesn't kill the send.",
  },
  {
    step: "4",
    title: "Mail comes back",
    body: "Claim an address and the inbox plugin registers a route with MailKite. Incoming mail arrives at /api/auth/mailkite/inbox/webhook, is HMAC-verified against that route's own signing secret, stored against the owning mailbox, and read through session-scoped endpoints.",
  },
];

export const Features = () => {
  return (
    <section id="how-it-works" className="pb-28 lg:pb-32">
      <div className="container">
        {/* Top dashed line with text */}
        <div className="relative flex items-center justify-center">
          <DashedLine className="text-muted-foreground" />
          <span className="bg-muted text-muted-foreground absolute px-3 font-mono text-sm font-medium tracking-wide max-md:hidden">
            SEND AND RECEIVE. NOT JUST SEND.
          </span>
        </div>

        {/* Content */}
        <div className="mx-auto mt-10 grid max-w-4xl items-center gap-3 md:gap-0 lg:mt-24 lg:grid-cols-2">
          <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
            What actually happens
          </h2>
          <p className="text-muted-foreground leading-snug">
            Every email surface Better Auth ships is outbound — a magic link, an
            OTP, an invitation. When someone replies, there is nowhere for it to
            land. These two plugins cover both directions.
          </p>
        </div>

        {/* Steps */}
        <Card className="mt-8 rounded-3xl md:mt-12 lg:mt-20">
          <CardContent className="grid gap-8 p-6 md:p-10 lg:grid-cols-2 lg:gap-10">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                    {s.step}
                  </span>
                  <h3 className="text-foreground font-semibold">{s.title}</h3>
                </div>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {s.body}
                </p>
                {i < steps.length - 1 && (
                  <ArrowDown
                    className="text-muted-foreground/40 absolute -bottom-6 left-3 size-4 lg:hidden"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-muted-foreground mx-auto mt-8 max-w-3xl text-center text-sm">
          Neither plugin puts a MailKite API key in the browser, and the sending
          one adds no database tables — it&apos;s a transport, so there&apos;s no
          migration to run just to send a password-reset email.
        </p>
      </div>
    </section>
  );
};
