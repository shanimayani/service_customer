"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategory } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { CATEGORIES } from "@/lib/constants";

export async function createTicket(formData: FormData) {
  const phoneRaw = String(formData.get("phone") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const categoryInput = String(formData.get("category") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const phone = normalizePhone(phoneRaw);
  if (!phone || !subject) {
    redirect("/dashboard/new?error=" + encodeURIComponent("יש למלא טלפון תקין ונושא לפנייה"));
  }

  const userCategory = await getUserCategory();
  const category = userCategory ?? (CATEGORIES.includes(categoryInput) ? categoryInput : "כללי");

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

  redirect(`/dashboard/${ticket.id}`);
}
