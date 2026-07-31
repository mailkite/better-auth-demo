"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, useSession } from "@/lib/auth-client";
import { type Message, snippet, toThreads } from "@/lib/thread";

/** Domain addresses are provisioned on. Matches MAIL_DOMAIN on the server. */
const DOMAIN = "auth.mailkite.dev";

type Res = { data?: unknown; error?: { message?: string } | null };

type Mailbox = { id: string; address: string };

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
  const [openThread, setOpenThread] = useState<string | null>(null);
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
  const threads = toThreads(messages);

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

  async function sendReply(e: React.FormEvent, target: Message) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api().reply({ messageId: target.id, text: replyText });
      if (res.error) setError(res.error.message ?? "Could not send the reply.");
      else {
        setNote(`Replied to ${target.fromAddress}.`);
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

          {threads.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                {mailbox
                  ? `Nothing yet. Email ${mailbox.address} and it will appear here.`
                  : "Claim an address above to get started."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {threads.map((t) => {
                const open = openThread === t.key;
                // Reply to the newest message in the conversation — replying to the
                // first one would thread the answer under a message the other party
                // may have already followed up on.
                const target = t.messages[t.messages.length - 1];
                return (
                  <Card key={t.key} className={open ? "" : "hover:border-primary/40"}>
                    {/* Collapsed row: the whole card is the control, so the hit
                        target matches what looks clickable. */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenThread(open ? null : t.key);
                        setReplyText("");
                      }}
                      aria-expanded={open}
                      className="w-full px-6 py-4 text-left"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className={t.unread ? "font-semibold" : "font-medium"}
                          >
                            {t.subject}
                          </span>
                          {t.count > 1 && (
                            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-[11px]">
                              {t.count}
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(t.latest.receivedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
                        {t.latest.direction === "outbound"
                          ? `you → ${t.latest.toAddress}`
                          : t.latest.fromAddress}
                      </p>
                      {!open && (
                        <p className="text-muted-foreground mt-2 truncate text-sm">
                          {snippet(t.latest) || "(no content)"}
                        </p>
                      )}
                    </button>

                    {open && (
                      <CardContent className="border-t pt-4">
                        <div className="grid gap-4">
                          {t.messages.map((m) => (
                            <div
                              key={m.id}
                              className={
                                m.direction === "outbound"
                                  ? "border-primary/40 border-l-2 pl-4"
                                  : "border-border border-l-2 pl-4"
                              }
                            >
                              <p className="text-muted-foreground font-mono text-xs break-all">
                                {m.direction === "outbound" ? "you" : m.fromAddress}
                                {" · "}
                                {new Date(m.receivedAt).toLocaleString()}
                              </p>
                              <p className="mt-2 text-sm whitespace-pre-wrap">
                                {m.text?.trim() || snippet(m) || "(no content)"}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Reply lives inside the open conversation only — a reply
                            box on every collapsed row is noise, and it is never
                            obvious which message it would answer. */}
                        <form
                          onSubmit={(e) => sendReply(e, target)}
                          className="mt-5 grid gap-2 border-t pt-4"
                        >
                          <Input
                            placeholder={`Reply to ${target.direction === "outbound" ? target.toAddress : target.fromAddress}`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            required
                          />
                          <div className="flex items-center gap-2">
                            <Button type="submit" size="sm" disabled={busy}>
                              {busy ? "Sending…" : "Send reply"}
                            </Button>
                            <p className="text-muted-foreground text-xs">
                              Sent from {mailbox?.address ?? "your address"}, threaded
                              to the original.
                            </p>
                          </div>
                        </form>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </section>
    </Background>
  );
};

export default Inbox;
