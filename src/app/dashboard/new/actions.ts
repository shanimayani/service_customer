"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategories } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { CATEGORIES } from "@/lib/constants";
import { findLinkTarget } from "@/lib/ticketLinking";
import { addTicketAttachments } from "@/lib/attachments";

export async function createTicket(formData: FormData) {
  const phoneRaw = String(formData.get("phone") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const categoryInput = String(formData.get("category") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  const phone = normalizePhone(phoneRaw);
  if (!phone || !subject) {
    redirect("/dashboard/new?error=" + encodeURIComponent("יש למלא טלפון תקין ונושא לפנייה"));
  }

  const userCategories = await getUserCategories();
  const category = userCategories
    ? userCategories.includes(categoryInput)
      ? categoryInput
      : userCategories[0]
    : CATEGORIES.includes(categoryInput)
    ? categoryInput
    : "כללי";

  const db = supabaseAdmin();

  const customerPayload: { phone: string; name?: string; email?: string } = { phone };
  if (name) customerPayload.name = name;
  if (email) customerPayload.email = email;

  const { data: customer, error: custErr } = await db
    .from("customers")
    .upsert(customerPayload, { onConflict: "phone", ignoreDuplicates: false })
    .select("id")
    .single();

  if (custErr || !customer) {
    redirect("/dashboard/new?error=" + encodeURIComponent("שגיאה ביצירת הלקוח"));
  }

  // אם ללקוח כבר יש פנייה פתוחה — מתייחסים לזה כשיחה נוספת בתוך הפנייה
  // הקיימת, במקום ליצור פנייה נפרדת (אותו היגיון כמו שיחות מ-Genie).
  const linkTarget = await findLinkTarget(db, customer.id);
  if (linkTarget) {
    const callSummary = note ? `${subject}\n${note}` : subject;
    await db.from("ticket_calls").insert({
      ticket_id: linkTarget.id,
      call_summary: callSummary,
      source: "manual",
    });

    if (linkTarget.status === "waiting") {
      await db.from("tickets").update({ status: "in_progress" }).eq("id", linkTarget.id);
    }

    if (files.length) await addTicketAttachments(db, linkTarget.id, files);

    redirect(`/dashboard/${linkTarget.id}`);
  }

  const { data: ticket, error: tickErr } = await db
    .from("tickets")
    .insert({
      customer_id: customer.id,
      subject,
      category,
      status: "new",
      source: "manual",
    })
    .select("id")
    .single();

  if (tickErr || !ticket) {
    redirect("/dashboard/new?error=" + encodeURIComponent("שגיאה ביצירת הפנייה"));
  }

  if (note) {
    await db.from("notes").insert({ ticket_id: ticket.id, content: note });
  }

  if (files.length) await addTicketAttachments(db, ticket.id, files);

  redirect(`/dashboard/${ticket.id}`);
}
