import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function Footer() {
  const navigation = [
    { name: "How it works", href: "/#how-it-works" },
    { name: "Try the inbox", href: "/inbox" },
    { name: "FAQ", href: "/faq" },
  ];

  const external = [
    { name: "Demo source", href: "https://github.com/mailkite/better-auth-demo" },
    { name: "Docs", href: "https://mailkite.dev/docs/auth/better-auth" },
    { name: "npm", href: "https://www.npmjs.com/package/@mailkite/better-auth" },
    { name: "Better Auth", href: "https://better-auth.com" },
  ];

  return (
    <footer className="flex flex-col items-center gap-14 pt-28 lg:pt-32">
      <div className="container space-y-3 text-center">
        <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
          Add both in about five minutes
        </h2>
        <p className="text-muted-foreground mx-auto max-w-xl leading-snug text-balance">
          <code>npm i @mailkite/better-auth @mailkite/better-auth-inbox</code>,
          drop them into your <code>plugins</code> array, and Better Auth has
          email in both directions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="mt-4" asChild>
            <a href="https://mailkite.dev/docs/auth/better-auth">Read the docs</a>
          </Button>
          <Button size="lg" variant="outline" className="mt-4" asChild>
            <a href="https://github.com/mailkite/better-auth-demo">
              Demo source
            </a>
          </Button>
        </div>
      </div>

      <nav className="container flex flex-col items-center gap-4">
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="font-medium transition-opacity hover:opacity-75"
              >
                {item.name}
              </Link>
            </li>
          ))}
          {external.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center gap-0.5 font-medium transition-opacity hover:opacity-75"
              >
                {item.name} <ArrowUpRight className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground max-w-2xl text-center text-sm">
          A public demo — accounts and mail here are wiped without notice, so
          don&apos;t put anything sensitive in it. Built on the{" "}
          <Link
            href="https://github.com/shadcnblocks/mainline-nextjs-template"
            className="underline underline-offset-4"
          >
            shadcnblocks Mainline template
          </Link>
          .
        </p>
      </nav>

      {/* The template closed on a giant "mainline" wordmark. Ours, and kept as
          text rather than traced paths so it stays legible and translatable. */}
      <div className="mt-10 w-full overflow-hidden md:mt-14 lg:mt-20">
        <div className="flex items-end justify-center gap-3 pb-2">
          <Logo className="[&>span:last-child]:hidden [&>svg]:size-[clamp(2.5rem,9vw,7rem)]" />
          <span className="from-primary bg-gradient-to-b to-transparent bg-clip-text text-[clamp(2.5rem,13vw,10rem)] leading-none font-semibold tracking-tighter text-transparent">
            MailKite
          </span>
        </div>
      </div>
    </footer>
  );
}
