import { supabaseAdmin } from "@/lib/supabase";

export const MAX_ATTACHMENTS_PER_TICKET = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

type Db = ReturnType<typeof supabaseAdmin>;

/**
 * מעלה קבצים לפנייה, בלי לחרוג ממכסה של MAX_ATTACHMENTS_PER_TICKET קבצים לפנייה
 * (כולל קבצים שכבר קיימים לה). קבצים עודפים מעבר למכסה מתעלמים בשקט.
 */
export async function addTicketAttachments(db: Db, ticketId: string, files: File[]) {
  const valid = files.filter((f) => f && f.size > 0 && f.size <= MAX_FILE_SIZE);
  if (!valid.length) return;

  const { count } = await db
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("ticket_id", ticketId);

  const remaining = MAX_ATTACHMENTS_PER_TICKET - (count ?? 0);
  if (remaining <= 0) return;

  for (const [i, file] of valid.slice(0, remaining).entries()) {
    const path = `${ticketId}/${Date.now()}-${i}-${file.name}`;

    const { error: upErr } = await db.storage
      .from("attachments")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      console.error("upload failed", upErr);
      continue;
    }

    await db.from("attachments").insert({
      ticket_id: ticketId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });
  }
}
