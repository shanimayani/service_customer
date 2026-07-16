import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { supabaseAdmin } from "@/lib/supabase";

type Db = ReturnType<typeof supabaseAdmin>;

async function getLastUid(db: Db): Promise<number> {
  const { data } = await db
    .from("email_poll_state")
    .select("value")
    .eq("key", "last_uid")
    .maybeSingle();
  return data ? parseInt(data.value, 10) : 0;
}

async function setLastUid(db: Db, uid: number) {
  await db.from("email_poll_state").upsert({ key: "last_uid", value: String(uid) });
}

/** חיתוך גס של ציטוט התכתובת הקודמת מתוך גוף התגובה, כדי לא לשמור הערה עם שרשור שלם */
function stripQuotedReply(text: string): string {
  const lines = text.split("\n");
  const cutIndex = lines.findIndex(
    (line) =>
      /^On .+wrote:$/.test(line.trim()) ||
      /^-----Original Message-----/i.test(line.trim()) ||
      /^>/.test(line.trim())
  );
  return (cutIndex === -1 ? lines : lines.slice(0, cutIndex)).join("\n").trim();
}

function lastReference(references: string | string[] | undefined): string | undefined {
  if (!references) return undefined;
  return Array.isArray(references) ? references[references.length - 1] : references;
}

/**
 * בודקת תגובות חדשות בתיבת המייל (קריאה בלבד — לא מסמנת כנקרא, לא מזיזה/מוחקת כלום,
 * כי בן אדם גם קורא את התיבה הזו ידנית). מזהה תגובות לפי Message-ID של מיילים שנשלחו
 * מהמערכת (ticket_emails), ורושמת אותן כהערה על הפנייה המתאימה.
 */
export async function pollEmailReplies(): Promise<{ scanned: number; matched: number }> {
  const { SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("Missing SMTP_USER/SMTP_PASSWORD env vars");
  }

  const db = supabaseAdmin();
  const lastUid = await getLastUid(db);

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    logger: false,
  });

  let scanned = 0;
  let matched = 0;
  let maxUid = lastUid;

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      const status = await client.status("INBOX", { uidNext: true });
      const uidNext = status.uidNext ?? 1;
      if (uidNext - 1 <= lastUid) {
        return { scanned: 0, matched: 0 };
      }

      for await (const msg of client.fetch(
        `${lastUid + 1}:*`,
        { uid: true, source: true },
        { uid: true }
      )) {
        scanned++;
        if (msg.uid > maxUid) maxUid = msg.uid;
        if (!msg.source) continue;

        const parsed = await simpleParser(msg.source);
        const inReplyTo = parsed.inReplyTo?.trim() || lastReference(parsed.references);
        if (!inReplyTo) continue;

        const { data: outbound } = await db
          .from("ticket_emails")
          .select("ticket_id")
          .eq("message_id", inReplyTo)
          .eq("direction", "outbound")
          .maybeSingle();

        if (!outbound) {
          console.log("email reply poll: no matching ticket for message_id", inReplyTo);
          continue;
        }

        const from = parsed.from?.text ?? "לא ידוע";
        const body = stripQuotedReply(parsed.text ?? "");

        await db.from("notes").insert({
          ticket_id: outbound.ticket_id,
          content: `תגובה למייל מ-${from}: ${body}`,
        });

        await db.from("ticket_emails").insert({
          ticket_id: outbound.ticket_id,
          message_id: parsed.messageId ?? `inbound-uid-${msg.uid}`,
          direction: "inbound",
        });

        matched++;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  if (maxUid > lastUid) await setLastUid(db, maxUid);

  return { scanned, matched };
}
