import { createClient } from "@/lib/supabase/server";

/** מחזיר את הקטגוריה שהמשתמש המחובר מוגבל אליה (app_metadata.category), או null אם אין הגבלה. */
export async function getUserCategory(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const appMetadata = data?.claims?.app_metadata as { category?: string } | undefined;
  return appMetadata?.category ?? null;
}
