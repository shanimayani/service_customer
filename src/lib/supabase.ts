import { createClient } from "@supabase/supabase-js";

/**
 * קליינט צד-שרת בלבד (service_role עוקף RLS).
 * לעולם לא לייבא את הקובץ הזה לקומפוננטת client.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
