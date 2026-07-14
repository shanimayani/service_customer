import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** קליינט Supabase לזיהוי/סשן, לשימוש ברכיבי שרת ו-Server Actions בלבד. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // נקרא מתוך Server Component (לא ניתן לכתוב cookies) — proxy.ts כבר מרענן את הסשן.
          }
        },
      },
    }
  );
}
