"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, useSession } from "@/lib/auth-client";

/** Domain addresses are provisioned on. Matches MAIL_DOMAIN on the server. */
const DOMAIN = "auth.mailkite.dev";

type Res = { data?: unknown; error?: { message?: string } | null };

type Mailbox = { id: string; address: string };

type Message = {
  id: string;
  mailboxId: string;
  fromAddress: string;
  toAddress: string;
  subject?: string | null;
  text?: string | null;
  read?: boolean;
  receivedAt: string;
};

/** Narrow the client's loosely-typed responses without pretending they're guaranteed. */
function pick<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && key in data) {
    const v = (data as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

/**
 * A pronounceable suggestion, so the field is never empty and nobody has to invent
 * something before they can try the demo. Random enough to rarely collide, and a
 * collision is a clean "already taken" they can just edit.
 */
function suggestLocalPart() {
  const words = [
    "ada", "grace", "hopper", "turing", "lovelace", "curie",
    "noether", "hamilton", "shannon", "knuth", "ritchie", "liskov",
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}${Math.floor(Math.random() * 900 + 100)}`;
}

const Inbox = () => {
  const { data: session, isPending } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [localPart, setLocalPart] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fill the field once, not on every keystroke-driven re-render — regenerating a
  // suggestion under the user's cursor is maddening.
  const suggested = useRef(suggestLocalPart());
  useEffect(() => {
    setLocalPart((v) => v || suggested.current);
  }, []);

  /**
   * Reach the inbox endpoints through the Better Auth client.
   *
   * Called as a function, never hoisted into a variable used as a hook dependency:
   * the client is a Proxy that mints a fresh object on every property access, so
   * holding it in a variable makes every callback unstable and loops the effect.
   */
  const api = () =>
    (
      authClient as unknown as {
        mailkite: {
          inbox: {
            mailboxes: (a?: unknown) => Promise<Res>;
            messages: (a?: unknown) => Promise<Res>;
            provision: (a: unknown) => Promise<Res>;
            reply: (a: unknown) => Promise<Res>;
          };
        };
      }
    ).mailkite.inbox;

  /**
   * Load the caller's mailbox and only the mail addressed to it.
   *
   * Scoped with `mailboxId` on purpose: an account that has claimed several
   * addresses over time would otherwise see every message it has ever received
   * pooled into one list, which reads like a bug.
   */
  const load = useCallback(async () => {
    try {
      const boxes = await api().mailboxes();
      if (boxes.error) {
        setError(boxes.error.message ?? "Could not load your inbox.");
        return;
      }
      const list = pick<Mailbox>(boxes.data, "mailboxes");
      const current = list[list.length - 1] ?? null; // most recently claimed
      setMailbox(current);

      if (!current) {
        setMessages([]);
        setError(null);
        return;
      }

      const res = await api().messages({ query: { mailboxId: current.id } });
      if (res.error) setError(res.error.message ?? "Could not load messages.");
      else {
        setMessages(pick<Message>(res.data, "messages"));
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your inbox.");
    }
  }, []);

  // Keyed on the user id, not the session object — useSession hands back a new
  // reference on every refresh, which would re-trigger this on a timer.
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  /**
   * Refresh when the tab regains attention, instead of a Refresh button.
   *
   * Event-driven, not a timer: nothing here polls. It fits how the demo is
   * actually used — you send mail from another app, come back to this tab, and
   * the message is already there.
   */
  useEffect(() => {
    if (!userId) return;
    const onWake = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [userId, load]);

  async function provision() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await api().provision({ localPart });
      if (res.error) {
        setError(res.error.message ?? "Could not claim that address.");
      } else {
        const addr = (res.data as { address?: string } | undefined)?.address;
        setNote(
          addr
            ? `${addr} is live. Email it from anywhere and it will appear below.`
            : "Address claimed.",
        );
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyTo) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api().reply({ messageId: replyTo.id, text: replyText });
      if (res.error) setError(res.error.message ?? "Could not send the reply.");
      else {
        setNote(`Replied to ${replyTo.fromAddress}.`);
        setReplyTo(null);
        setReplyText("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  if (isPending) {
    return (
      <Background>
        <section className="py-28 lg:pt-44">
          <div className="container text-center">Loading…</div>
        </section>
      </Background>
    );
  }

  if (!session) {
    return (
      <Background>
        <section className="py-28 lg:pt-44 lg:pb-32">
          <div className="container">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader>
                <p className="text-2xl font-bold">Sign in first</p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-muted-foreground text-sm">
                  The inbox is session-scoped — you can only read mail addressed
                  to a mailbox you own.
                </p>
                <Link href="/login">
                  <Button className="w-full">Go to sign in</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </Background>
    );
  }

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container max-w-3xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Your inbox</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Signed in as {session.user.email}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => authClient.signOut().then(() => location.assign("/"))}
            >
              Sign out
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <p className="font-semibold">
                {mailbox ? "Your address" : "Claim an address"}
              </p>
              <p className="text-muted-foreground text-sm">
                {mailbox
                  ? "A real mailbox. Send it an email from anywhere and it shows up here."
                  : "Provisions a real mailbox and registers the inbound route with MailKite."}
              </p>
            </CardHeader>
            <CardContent>
              {mailbox ? (
                <p className="font-mono text-sm break-all">{mailbox.address}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {/* The domain sits inside the field so the full address is
                      visible before you commit to it, not revealed afterwards. */}
                  <div className="border-input bg-background focus-within:ring-ring flex items-center rounded-md border focus-within:ring-1">
                    <Input
                      value={localPart}
                      onChange={(e) => setLocalPart(e.target.value)}
                      aria-label="Address you want"
                      className="w-36 border-0 pr-0 shadow-none focus-visible:ring-0"
                    />
                    <span className="text-muted-foreground pr-3 pl-0.5 font-mono text-sm">
                      @{DOMAIN}
                    </span>
                  </div>
                  <Button onClick={provision} disabled={busy || !localPart}>
                    {busy ? "Claiming…" : "Claim"}
                  </Button>
                </div>
              )}
              {note && (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                  {note}
                </p>
              )}
              {error && (
                <p className="text-destructive mt-3 text-sm" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          {messages.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                {mailbox
                  ? `Nothing yet. Email ${mailbox.address} and it will appear here.`
                  : "Claim an address above to get started."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {messages.map((m) => (
                <Card key={m.id}>
                  <CardContent className="py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold">
                        {m.subject || "(no subject)"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(m.receivedAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
                      {m.fromAddress} → {m.toAddress}
                    </p>
                    {m.text && (
                      <p className="mt-3 text-sm whitespace-pre-wrap">{m.text}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setReplyTo(m)}
                    >
                      Reply
                    </Button>

                    {replyTo?.id === m.id && (
                      <form onSubmit={sendReply} className="mt-4 grid gap-2">
                        <Input
                          placeholder="Your reply"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={busy}>
                            Send
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyTo(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Sent from the mailbox that received it, threaded to the
                          original — not from your personal address.
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Background>
  );
};

export default Inbox;
