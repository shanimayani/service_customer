"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategories } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";

export async function createStaffAccount(formData: FormData) {
  const userCategories = await getUserCategories();
  if (userCategories) {
    // הגנת עומק: רק חשבון ללא הגבלת מחלקה יכול ליצור אנשי צוות.
    redirect("/dashboard/staff?error=" + encodeURIComponent("אין הרשאה"));
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const categories = formData.getAll("categories").map(String).filter((c) => CATEGORIES.includes(c));

  const db = supabaseAdmin();
  const { error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { categories },
  });

  if (error) {
    redirect("/dashboard/staff?error=" + encodeURIComponent(error.message));
  }

  redirect("/dashboard/staff?success=1");
}

export async function updateStaffCategories(userId: string, categories: string[]) {
  const userCategories = await getUserCategories();
  if (userCategories) {
    // הגנת עומק: רק חשבון ללא הגבלת מחלקה יכול לערוך הרשאות של אנשי צוות.
    redirect("/dashboard/staff?error=" + encodeURIComponent("אין הרשאה"));
  }

  const valid = categories.filter((c) => CATEGORIES.includes(c));

  const db = supabaseAdmin();
  const { error } = await db.auth.admin.updateUserById(userId, {
    app_metadata: { categories: valid },
  });

  if (error) {
    redirect("/dashboard/staff?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/staff");
}
