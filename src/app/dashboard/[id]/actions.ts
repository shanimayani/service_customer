"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export async function updateStatus(ticketId: string, status: string) {
  const db = supabaseAdmin();
  const { data: updated } = await db
    .from("tickets")
    .update({ status })
    .eq("id", ticketId)
    .select("customer_id")
    .single();

  // סגירת פנייה סוגרת גם פניות פתוחות אחרות של אותו לקוח (למשל שיחות
  // חוזרות שכבר הוסתרו מהדשבורד תחת הפנייה הזו) — כדי שלא יישארו תקועות.
  if (updated && (status === "closed" || status === "auto_closed")) {
    await db
      .from("tickets")
      .update({ status })
      .eq("customer_id", updated.customer_id)
      .neq("id", ticketId)
      .in("status", ["new", "in_progress"]);
  }

  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function updateSubject(ticketId: string, subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) return;
  const db = supabaseAdmin();
  await db.from("tickets").update({ subject: trimmed }).eq("id", ticketId);
  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function updateCategory(ticketId: string, category: string) {
  const db = supabaseAdmin();
  await db.from("tickets").update({ category }).eq("id", ticketId);
  revalidatePath(`/dashboard/${ticketId}`);
  revalidatePath("/dashboard");
}

export async function addNote(ticketId: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  const db = supabaseAdmin();
  await db.from("notes").insert({ ticket_id: ticketId, content });
  revalidatePath(`/dashboard/${ticketId}`);
}

export async function uploadAttachment(ticketId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;
  if (file.size > 20 * 1024 * 1024) return; // עד 20MB

  const db = supabaseAdmin();
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

/** פרטי תצוגה מקדימה של פנייה, לחלון הקטן שנפתח מתוך "פניות קודמות" */
export async function getTicketPreview(ticketId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("tickets")
    .select("id, subject, status, category, created_at, call_summary")
    .eq("id", ticketId)
    .maybeSingle();
  return data;
}

/** מחזיר קישור חתום זמני להורדת קובץ מה-bucket הפרטי */
export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data } = await db.storage
    .from("attachments")
    .createSignedUrl(storagePath, 60 * 10); // 10 דקות
  return data?.signedUrl ?? null;
}
