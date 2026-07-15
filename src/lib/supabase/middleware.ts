import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** מרענן את הסשן ומחזיר את המשתמש המחובר (אם יש), לשימוש מתוך proxy.ts. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (לא getClaims()) — מבצע קריאת רשת אמיתית לשרת ה-Auth, שמבטיחה
  // רענון אמין של הסשן כשה-access token פג. getClaims() תלוי בקונפיגורציית
  // מפתחות JWT א-סימטריים בפרויקט Supabase, ולא ריענן סשנים בפועל.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
