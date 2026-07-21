"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { sanitizePolicyHtml } from "@/lib/sanitizeHtml";

export async function updatePolicy(content: string) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("לא מחובר/ת");

  const db = supabaseAdmin();
  await db.from("policy_document").upsert({
    id: 1,
    content: sanitizePolicyHtml(content),
    updated_at: new Date().toISOString(),
    updated_by: user.email,
  });

  revalidatePath("/dashboard/policy");
}
