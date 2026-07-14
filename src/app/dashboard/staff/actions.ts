"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategory } from "@/lib/auth";

export async function createStaffAccount(formData: FormData) {
  const userCategory = await getUserCategory();
  if (userCategory) {
    // הגנת עומק: רק חשבון ללא הגבלת מחלקה יכול ליצור אנשי צוות.
    redirect("/dashboard/staff?error=" + encodeURIComponent("אין הרשאה"));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const category = String(formData.get("category") ?? "");

  const db = supabaseAdmin();
  const { error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: category ? { category } : {},
  });

  if (error) {
    redirect("/dashboard/staff?error=" + encodeURIComponent(error.message));
  }

  redirect("/dashboard/staff?success=1");
}
