import { createClient } from "@/lib/supabase/server";

type AppMetadata = { category?: string; categories?: string[] };

/**
 * מחלץ את רשימת הקטגוריות שהמשתמש מוגבל אליהן מתוך app_metadata.
 * תומך גם במשתמשים ישנים שנוצרו לפני התמיכה בכמה מחלקות (שדה category יחיד) —
 * ברגע שנשמר עבורם השדה החדש categories (אפילו ריק), הוא זה שקובע.
 */
export function categoriesFromAppMetadata(rawAppMetadata: Record<string, unknown> | null | undefined): string[] | null {
  const appMetadata = rawAppMetadata as AppMetadata | null | undefined;
  if (appMetadata?.categories !== undefined) {
    return appMetadata.categories.length ? appMetadata.categories : null;
  }
  if (appMetadata?.category) return [appMetadata.category];
  return null;
}

/** מחזירה את הקטגוריות שהמשתמש המחובר מוגבל אליהן, או null אם אין הגבלה (גישה מלאה). */
export async function getUserCategories(): Promise<string[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return categoriesFromAppMetadata(user?.app_metadata);
}
