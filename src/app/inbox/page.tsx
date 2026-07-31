"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, useSession } from "@/lib/auth-client";

type Res = { data?: unknown; error?: { message?: string } | null };

type Message = {
  id: string;
  fromAddress: string;
  toAddress: string;
  subject?: string | null;
  text?: string | null;
  read?: boolean;
  receivedAt: string;
};

/** Narrow the client's loosely-typed responses without pretending they're guaranteed. */
function asMessages(data: unknown): Message[] {
  if (Array.isArray(data)) return data as Message[];
  if (data && typeof data === "object" && "messages" in data) {
    const m = (data as { messages?: unknown }).messages;
    if (Array.isArray(m)) return m as Message[];
  }
  return [];
}

const Inbox = () => {
  const { data: session, isPending } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [localPart, setLocalPart] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Reach the inbox endpoints through the Better Auth client.
   *
   * Called as a function, never hoisted into a variable used as a hook
   * dependency: the client is a Proxy that mints a fresh object on every
   * property access, so `const inbox = authClient.mailkite.inbox` produces a new
   * reference each render. Putting that in a useCallback dep list made `load`
   * unstable, which re-ran the effect, which re-rendered — an infinite fetch loop
   * that hammered the API and made errors strobe on screen.
   */
  const api = () =>
    (
      authClient as unknown as {
        mailkite: {
          inbox: {
            messages: (a?: unknown) => Promise<Res>;
            provision: (a: unknown) => Promise<Res>;
            reply: (a: unknown) => Promise<Res>;
          };
        };
      }
    ).mailkite.inbox;

  const load = useCallback(async () => {
    try {
      const res = await api().messages({});
      if (res.error) setError(res.error.message ?? "Could not load messages.");
      else {
        setMessages(asMessages(res.data));
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    }
  }, []);

  // Keyed on the user id, not the session object — `useSession` hands back a new
  // object reference on every poll, which would re-trigger this on a timer.
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  async function provision() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await api().provision({ localPart: localPart || undefined });
      if (res.error) {
        setError(res.error.message ?? "Could not claim an address.");
      } else {
        const addr =
          (res.data as { address?: string } | undefined)?.address ?? null;
        setAddress(addr);
        setNote(
          addr
            ? `Your inbox is live at ${addr} — send it an email and it will appear below.`
            : "Address claimed.",
        );
        await load(); // pick the new (empty) mailbox up straight away
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
                  The inbox is session-scoped — you can only read mail addressed to a
                  mailbox you own.
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
              <p className="font-semibold">Claim an address</p>
              <p className="text-muted-foreground text-sm">
                Provisions a real mailbox on the demo domain and registers the inbound
                route with MailKite.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="local part (optional)"
                  value={localPart}
                  onChange={(e) => setLocalPart(e.target.value)}
                  className="max-w-56"
                />
                <Button onClick={provision} disabled={busy}>
                  {busy ? "Working…" : "Claim"}
                </Button>
                <Button variant="outline" onClick={load} disabled={busy}>
                  Refresh
                </Button>
              </div>
              {address && (
                <p className="mt-3 font-mono text-sm">{address}</p>
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
                No mail yet. Claim an address above, send it an email, and refresh.
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
                    <p className="text-muted-foreground mt-1 font-mono text-xs">
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
