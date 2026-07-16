import { supabaseAdmin } from "@/lib/supabase";

type Db = ReturnType<typeof supabaseAdmin>;

/**
 * מחפשת פנייה פתוחה (חדשה/בטיפול/ממתינה ללקוח) של הלקוח, אליה אפשר לקשר
 * שיחה חוזרת כ"פנייה נוספת" (ticket_calls) במקום ליצור פנייה נפרדת.
 * מחזירה null אם אין פנייה פתוחה — במקרה הזה יוצרים פנייה חדשה כרגיל.
 */
export async function findLinkTarget(
  db: Db,
  customerId: string
): Promise<{ id: string; status: string } | null> {
  const { data } = await db
    .from("tickets")
    .select("id, status")
    .eq("customer_id", customerId)
    .in("status", ["new", "in_progress", "waiting"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
