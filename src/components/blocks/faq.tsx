import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "The demo",
    questions: [
      {
        question: "Are the emails real?",
        answer:
          "Yes. Every message this site sends goes out through MailKite from better-auth@auth.mailkite.dev, and mail you send to an address you claim really arrives. Use an address you can check — nothing here is stubbed.",
      },
      {
        question: "What can I try?",
        answer:
          "Sign up and you get a verification email. Sign in with a magic link, a 6-digit code, or a password. Then claim an inbox address, email it from anywhere, watch it appear, and reply from the app.",
      },
      {
        question: "Is my data kept?",
        answer:
          "This is a public demo on a throwaway database. Don't put anything sensitive in it, and assume the accounts and mail here get wiped without notice.",
      },
    ],
  },
  {
    title: "The plugins",
    questions: [
      {
        question: "Do I need both?",
        answer:
          "No. They're independent. @mailkite/better-auth sends Better Auth's outbound email; @mailkite/better-auth-inbox lets your app receive mail. Install either, or both.",
      },
      {
        question: "Will the sending plugin make me run a migration?",
        answer:
          "No. It declares no schema and no endpoints — it's a transport, and sending a password-reset email shouldn't cost you a database table. The inbox plugin does add two tables, because receiving genuinely needs somewhere to put the mail.",
      },
      {
        question: "Why aren't magic links wired automatically like verification is?",
        answer:
          "Better Auth reads sendVerificationEmail and sendResetPassword off the resolved root options, so a plugin's init() can supply them. The magicLink, emailOTP and organization plugins read their callback from their own closure instead, which no other plugin can reach — so you pass those three by hand off the same object.",
      },
      {
        question: "Does the browser ever hold a MailKite API key?",
        answer:
          "Never. Every inbox call is session-authenticated against your own auth server, which holds the credential and does the privileged work.",
      },
    ],
  },
  {
    title: "Under the hood",
    questions: [
      {
        question: "Why aren't email sends awaited?",
        answer:
          "Because a slower response when an account exists tells an attacker who has an account. The plugin dispatches and returns immediately, and send failures go to onError rather than to the caller — a thrown error is the same side channel wearing a different hat. On serverless you pass waitUntil so the runtime keeps the request alive for the send.",
      },
      {
        question: "How is inbound mail verified?",
        answer:
          "Every delivery carries an x-mailkite-signature header, HMAC-SHA256 over the timestamp and the raw body, checked in constant time and rejected outside a replay window. MailKite mints a signing secret per route, so a claimed address is verified against its own secret rather than a shared one.",
      },
      {
        question: "Can I read someone else's mail?",
        answer:
          "No. Reads are scoped to mailboxes you own plus your active organization's. A mailbox id you don't own returns a 404 identical to one that doesn't exist — and identical whether or not you own any mailbox at all, so it can't be used to probe which ids are real.",
      },
      {
        question: "What is this built on?",
        answer:
          "The shadcnblocks Mainline template, Next.js 15 on Cloudflare Workers via OpenNext, and Better Auth on D1. The source is public.",
      },
    ],
  },
];

export const FAQ = ({
  headerTag = "h2",
  className,
  className2,
}: {
  headerTag?: "h1" | "h2";
  className?: string;
  /** Extra classes for the header block — used by /faq to centre and narrow it. */
  className2?: string;
}) => {
  const Heading = headerTag;
  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container max-w-5xl">
        {/* Header spans the full width; the categories sit in two columns below it. */}
        <div className={cn("max-w-2xl space-y-4", className2)}>
          <Heading className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
            Questions about the plugins
          </Heading>
          <p className="text-muted-foreground leading-snug">
            If it isn&apos;t answered here, the{" "}
            <Link
              href="https://mailkite.dev/docs/auth/better-auth"
              className="underline underline-offset-4"
            >
              docs
            </Link>{" "}
            and the{" "}
            <Link
              href="https://github.com/mailkite/better-auth-demo"
              className="underline underline-offset-4"
            >
              demo source
            </Link>{" "}
            are both public.
          </p>
        </div>

        <div className="mt-12 grid gap-x-12 gap-y-8 text-start md:grid-cols-2 lg:mt-16">
          {categories.map((category, categoryIndex) => (
            <div key={category.title}>
              <h3 className="text-muted-foreground border-b py-4">
                {category.title}
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((item, i) => (
                  <AccordionItem key={i} value={`${categoryIndex}-${i}`}>
                    <AccordionTrigger className="text-start">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
