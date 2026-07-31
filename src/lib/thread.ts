/**
 * Grouping messages into conversations, and the one-line preview each row shows.
 *
 * Kept out of the page component so both are testable in isolation and so the
 * rendering code reads as layout rather than as parsing.
 */

export type Message = {
  id: string;
  mailboxId: string;
  messageId: string;
  direction?: string;
  fromAddress: string;
  toAddress: string;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  threadId?: string | null;
  read?: boolean;
  receivedAt: string;
};

export type Thread = {
  key: string;
  subject: string;
  messages: Message[];
  latest: Message;
  count: number;
  unread: boolean;
};

/**
 * The grouping key for a conversation.
 *
 * `threadId ?? messageId`: MailKite only assigns a threadId once a conversation
 * exists, so the first message of a thread has none and would otherwise sit in a
 * group of its own, separate from the replies that answer it.
 */
export function threadKey(m: Message): string {
  return m.threadId ?? m.messageId;
}

/** Strip tags and decode the few entities that actually show up in a preview. */
function htmlToText(html: string): string {
  return html
    // Drop whole elements whose contents are never body copy — otherwise CSS and
    // JS source leak into the snippet as a wall of punctuation.
    .replace(/<(script|style|head)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/**
 * The first line of real content, for the collapsed row.
 *
 * Prefers `text`, falls back to text extracted from `html` — a message may carry
 * only one of the two, and an HTML-only message would otherwise show a blank row.
 * Quoted history (`> …`) is skipped so a reply doesn't preview as the message it
 * is replying to.
 */
export function snippet(m: Message, max = 140): string {
  const source = m.text?.trim() ? m.text : m.html ? htmlToText(m.html) : "";
  const line = source
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith(">"));
  if (!line) return "";
  const collapsed = line.replace(/\s+/g, " ");
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}

/** Newest conversation first; oldest message first within a conversation. */
export function toThreads(messages: Message[]): Thread[] {
  const groups = new Map<string, Message[]>();
  for (const m of messages) {
    const key = threadKey(m);
    const list = groups.get(key);
    if (list) list.push(m);
    else groups.set(key, [m]);
  }

  const threads: Thread[] = [];
  for (const [key, list] of groups) {
    const ordered = [...list].sort(
      (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    );
    const latest = ordered[ordered.length - 1];
    threads.push({
      key,
      // The first message names the conversation; later "Re:" subjects are noise.
      subject: ordered[0].subject?.trim() || "(no subject)",
      messages: ordered,
      latest,
      count: ordered.length,
      // Only inbound mail can be unread — our own replies are not news to us.
      unread: ordered.some((m) => !m.read && m.direction !== "outbound"),
    });
  }

  return threads.sort(
    (a, b) =>
      new Date(b.latest.receivedAt).getTime() - new Date(a.latest.receivedAt).getTime(),
  );
}
