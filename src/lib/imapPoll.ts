import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/email";
import { findLinkTarget } from "@/lib/ticketLinking";
import { classifyEmail } from "@/lib/classifyEmail";
import { addTicketAttachments } from "@/lib/attachments";

type Db = ReturnType<typeof supabaseAdmin>;
type Outcome = "matched" | "created" | "skipped";

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

/** רושמת מייל נכנס על פנייה (הערה + מזהה ל-thread-matching עתידי + קבצים מצורפים) */
async function recordInboundEmail(
  db: Db,
  ticketId: string,
  parsed: ParsedMail,
  messageId: string,
  note: string
) {
  await db.from("notes").insert({ ticket_id: ticketId, content: note });
  await db.from("ticket_emails").insert({ ticket_id: ticketId, message_id: messageId, direction: "inbound" });

  const files = (parsed.attachments ?? [])
    .filter((a) => a.content?.length)
    .map((a) => new File([new Uint8Array(a.content)], a.filename ?? "attachment", { type: a.contentType }));
  if (files.length) await addTicketAttachments(db, ticketId, files);
}

/**
 * מעבדת מייל נכנס בודד: מזהה תגובה לשרשור מוכר, ואם לא — מאתרת/יוצרת לקוח
 * לפי כתובת השולח ומחליטה אם להצטרף לפנייה פתוחה קיימת או לפתוח פנייה חדשה.
 * מיוצאת בנפרד (לא רק פנימית ל-pollEmailReplies) כדי לאפשר בדיקה ישירה בלי IMAP אמיתי.
 */
export async function processIncomingEmail(db: Db, parsed: ParsedMail, uid: number): Promise<Outcome> {
  const fromAddress = parsed.from?.value?.[0]?.address;
  const systemAddress = process.env.SMTP_USER?.trim().toLowerCase();
  if (fromAddress?.trim().toLowerCase() === systemAddress) {
    console.log("email poll: self-addressed email, skipping uid", uid);
    return "skipped";
  }

  const inboundMessageId = parsed.messageId ?? `inbound-uid-${uid}`;
  const { data: already } = await db
    .from("ticket_emails")
    .select("id")
    .eq("message_id", inboundMessageId)
    .eq("direction", "inbound")
    .maybeSingle();
  if (already) {
    console.log("email poll: already recorded, skipping", inboundMessageId);
    return "skipped";
  }

  const body = stripQuotedReply(parsed.text ?? "");
  const from = parsed.from?.text ?? "לא ידוע";

  // --- תגובה לשרשור מוכר ---
  const inReplyTo = parsed.inReplyTo?.trim() || lastReference(parsed.references);
  if (inReplyTo) {
    const { data: outbound } = await db
      .from("ticket_emails")
      .select("ticket_id")
      .eq("message_id", inReplyTo)
      .eq("direction", "outbound")
      .maybeSingle();

    if (outbound) {
      await recordInboundEmail(
        db,
        outbound.ticket_id,
        parsed,
        inboundMessageId,
        `✉️ התקבלה תגובה במייל מ-${from}:\n${body}`
      );
      return "matched";
    }
    // כותרת תגובה קיימת אבל לא מתאימה לשום דבר מוכר (שרשור ישן, מייל מועבר) —
    // ממשיכים לנתיב הרגיל, כמו מייל חדש לגמרי.
  }

  // --- מייל חדש (או תגובה שלא זוהתה): מאתרים/יוצרים לקוח לפי אימייל, ואז מקשרים או פותחים פנייה ---
  const email = normalizeEmail(fromAddress);
  if (!email) {
    console.log("email poll: no usable From address, skipping uid", uid);
    return "skipped";
  }

  const { data: existingCustomer } = await db
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let customerId = existingCustomer?.id;
  if (!customerId) {
    const name = parsed.from?.value?.[0]?.name?.trim() || undefined;
    const { data: created, error } = await db
      .from("customers")
      .insert({ email, name })
      .select("id")
      .single();

    if (error?.code === "23505") {
      // הרצת poll חופפת כבר יצרה לקוח עם אותו אימייל בינתיים — משתמשים בשורה שלה
      const { data: retry } = await db.from("customers").select("id").eq("email", email).single();
      customerId = retry?.id;
    } else if (error || !created) {
      throw new Error(`customer insert failed: ${error?.message}`);
    } else {
      customerId = created.id;
    }
  }
  if (!customerId) throw new Error("could not resolve customer id for inbound email");

  const linkTarget = await findLinkTarget(db, customerId);
  if (linkTarget) {
    await recordInboundEmail(
      db,
      linkTarget.id,
      parsed,
      inboundMessageId,
      `✉️ התקבל מייל נוסף מ-${from}:\n${body}`
    );
    if (linkTarget.status === "waiting") {
      await db.from("tickets").update({ status: "in_progress" }).eq("id", linkTarget.id);
    }
    return "matched";
  }

  const subjectHeader = parsed.subject?.trim();
  const { category } = await classifyEmail(subjectHeader ?? "", body);
  const { data: ticket, error: tickErr } = await db
    .from("tickets")
    .insert({
      customer_id: customerId,
      subject: subjectHeader || undefined,
      category,
      status: "new",
      source: "email",
    })
    .select("id")
    .single();
  if (tickErr || !ticket) throw new Error(`ticket insert failed: ${tickErr?.message}`);

  await recordInboundEmail(db, ticket.id, parsed, inboundMessageId, `✉️ פנייה נפתחה ממייל מ-${from}:\n${body}`);
  return "created";
}

/**
 * בודקת מיילים חדשים בתיבת המייל (קריאה בלבד — לא מסמנת כנקרא, לא מזיזה/מוחקת כלום,
 * כי בן אדם גם קורא את התיבה הזו ידנית). תגובה לשרשור מוכר נרשמת כהערה על הפנייה
 * המתאימה; כל מייל אחר פותח פנייה חדשה או מצטרף לפנייה פתוחה של אותו לקוח.
 */
export async function pollEmailReplies(): Promise<{ scanned: number; matched: number; created: number }> {
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
  let created = 0;
  let maxUid = lastUid;

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      const status = await client.status("INBOX", { uidNext: true });
      const uidNext = status.uidNext ?? 1;
      if (uidNext - 1 <= lastUid) {
        return { scanned: 0, matched: 0, created: 0 };
      }

      for await (const msg of client.fetch(
        `${lastUid + 1}:*`,
        { uid: true, source: true },
        { uid: true }
      )) {
        scanned++;
        try {
          if (!msg.source) continue;
          const parsed = await simpleParser(msg.source);
          const outcome = await processIncomingEmail(db, parsed, msg.uid);
          if (outcome === "matched") matched++;
          else if (outcome === "created") created++;
        } catch (err) {
          // הודעה בודדת תקולה לא אמורה לתקוע את כל האצווה — נרשמת ל-console וממשיכים.
          console.error(`email poll: failed to process uid ${msg.uid}`, err);
        } finally {
          if (msg.uid > maxUid) maxUid = msg.uid;
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  if (maxUid > lastUid) await setLastUid(db, maxUid);

  return { scanned, matched, created };
}
