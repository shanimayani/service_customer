"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategory } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

type Db = ReturnType<typeof supabaseAdmin>;

/** זורק אם המשתמש מוגבל לקטגוריה אחרת מזו של הפנייה. משתמש ללא הגבלה עובר תמיד. */
async function assertTicketAccess(db: Db, ticketId: string) {
  const userCategory = await getUserCategory();
  if (!userCategory) return;
  const { data } = await db.from("tickets").select("category").eq("id", ticketId).maybeSingle();
  if (data?.category !== userCategory) {
    throw new Error("אין הרשאה לפנייה זו");
  }
}

export async function updateStatus(ticketId: string, status: string) {
  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);

  await db.from("tickets").update({ status }).eq("id", ticketId);

  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function updateSubject(ticketId: string, subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) return;
  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);
  await db.from("tickets").update({ subject: trimmed }).eq("id", ticketId);
  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function updateCategory(ticketId: string, category: string) {
  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);
  await db.from("tickets").update({ category }).eq("id", ticketId);
  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function updateCustomer(
  ticketId: string,
  customerId: string,
  data: { name: string; email: string }
) {
  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);
  await db
    .from("customers")
    .update({ name: data.name.trim() || null, email: data.email.trim() || null })
    .eq("id", customerId);
  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function addNote(ticketId: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);
  await db.from("notes").insert({ ticket_id: ticketId, content });
  revalidatePath(`/dashboard/${ticketId}`);
}

export async function uploadAttachment(ticketId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;
  if (file.size > 20 * 1024 * 1024) return; // עד 20MB

  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);
  const path = `${ticketId}/${Date.now()}-${file.name}`;

  const { error: upErr } = await db.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type });
  if (upErr) {
    console.error("upload failed", upErr);
    return;
  }

  await db.from("attachments").insert({
    ticket_id: ticketId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });

  revalidatePath(`/dashboard/${ticketId}`);
}

export async function sendTicketEmail(ticketId: string, formData: FormData) {
  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const attachmentIds = formData.getAll("attachmentIds").map(String);

  if (!to || !subject) {
    redirect(`/dashboard/${ticketId}?error=` + encodeURIComponent("יש למלא נמען ונושא למייל"));
  }

  const db = supabaseAdmin();
  await assertTicketAccess(db, ticketId);

  let attachments: { filename: string; content: Buffer }[] = [];
  if (attachmentIds.length) {
    // מוודאים שכל קובץ שנבחר שייך באמת לפנייה הזו, ולא סומכים על ה-id מהטופס
    const { data: rows } = await db
      .from("attachments")
      .select("id, storage_path, file_name")
      .eq("ticket_id", ticketId)
      .in("id", attachmentIds);

    attachments = await Promise.all(
      (rows ?? []).map(async (a) => {
        const { data: file } = await db.storage.from("attachments").download(a.storage_path);
        const buffer = Buffer.from(await (file as Blob).arrayBuffer());
        return { filename: a.file_name, content: buffer };
      })
    );
  }

  let messageId: string | undefined;
  try {
    const result = await sendEmail({ to, subject, text: body, attachments });
    messageId = result.messageId;
  } catch (err) {
    console.error("send email failed", err);
    redirect(`/dashboard/${ticketId}?error=` + encodeURIComponent("שליחת המייל נכשלה, נסי שוב"));
  }

  // שומרים את ה-Message-ID כדי שתגובה עתידית ללקוח תשויך אוטומטית לפנייה הזו
  if (messageId) {
    await db.from("ticket_emails").insert({
      ticket_id: ticketId,
      message_id: messageId,
      direction: "outbound",
    });
  }

  await db.from("notes").insert({
    ticket_id: ticketId,
    content: `נשלח מייל ל-${to}: ${subject}`,
  });

  revalidatePath(`/dashboard/${ticketId}`);
}

/** פרטי תצוגה מקדימה של פנייה, לחלון הקטן שנפתח מתוך "פניות קודמות" */
export async function getTicketPreview(ticketId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("tickets")
    .select("id, subject, status, category, created_at, call_summary")
    .eq("id", ticketId)
    .maybeSingle();

  const userCategory = await getUserCategory();
  if (userCategory && data?.category !== userCategory) return null;

  return data;
}

/** מחזיר קישור חתום זמני להורדת קובץ מה-bucket הפרטי */
export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  const db = supabaseAdmin();
  const ticketId = storagePath.split("/")[0];
  await assertTicketAccess(db, ticketId);

  const { data } = await db.storage
    .from("attachments")
    .createSignedUrl(storagePath, 60 * 10); // 10 דקות
  return data?.signedUrl ?? null;
}
