import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { categoriesFromAppMetadata } from "@/lib/auth";
import { STATUSES, CATEGORIES, type Status } from "@/lib/constants";
import FilterBar from "@/components/FilterBar";
import TicketRow from "@/components/TicketRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type Search = {
  status?: string;
  category?: string;
  q?: string;
  phone?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { status, category, q, phone, from, to, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const db = supabaseAdmin();

  const supabaseAuth = await createClient();
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser();
  const userEmail = authUser?.email;
  const userCategories = categoriesFromAppMetadata(authUser?.app_metadata);

  let phoneDigits = phone ? phone.replace(/\D/g, "") : "";
  // מספרים בישראל נשמרים בפורמט 972... בלי ה-0 המוביל, אז מסירים אותו גם
  // מהחיפוש (משתמשות בדרך כלל מקלידות 050... כמו שרגילות)
  if (phoneDigits.startsWith("0")) phoneDigits = phoneDigits.slice(1);

  let query = db
    .from("tickets")
    .select(
      "id, subject, category, status, created_at, call_summary, customer_id, customers!inner(name, phone)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status && status in STATUSES) query = query.eq("status", status);
  if (userCategories) {
    // מסננות רק בתוך הקטגוריות שהמשתמש מוגבל אליהן, גם אם ביקשו קטגוריה אחרת ב-URL
    const requested = category ? category.split(",").filter((c) => userCategories.includes(c)) : [];
    query = query.in("category", requested.length ? requested : userCategories);
  } else if (category) {
    query = query.in("category", category.split(","));
  }
  if (q) query = query.or(`subject.ilike.%${q}%,call_summary.ilike.%${q}%`);
  if (phoneDigits) query = query.ilike("customers.phone", `%${phoneDigits}%`);

  const isValidDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isValidDate(from)) query = query.gte("created_at", from);
  if (isValidDate(to)) {
    const dayAfter = new Date(to + "T00:00:00Z");
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
    query = query.lt("created_at", dayAfter.toISOString().slice(0, 10));
  }

  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;
  query = query.range(rangeFrom, rangeTo);

  const { data: tickets, error, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // ספירות לפי סטטוס לכותרת (מוגבל לקטגוריה של המשתמש, אם יש)
  let statusCountsQuery = db.from("tickets").select("status");
  if (userCategories) statusCountsQuery = statusCountsQuery.in("category", userCategories);
  const { data: allStatuses } = await statusCountsQuery;
  const counts: Record<string, number> = {};
  for (const t of allStatuses ?? []) counts[t.status] = (counts[t.status] ?? 0) + 1;

  // נפח שיחות נוספות שמוזגו לפניות פתוחות (לא נספרות כ"פניות" בפני עצמן)
  let callsCountQuery = db
    .from("ticket_calls")
    .select("id, tickets!inner(category)", { count: "exact", head: true });
  if (userCategories) callsCountQuery = callsCountQuery.in("tickets.category", userCategories);
  const { count: totalCalls } = await callsCountQuery;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-end items-center gap-3 mb-2">
        <Link href="/dashboard/policy" className="text-sm text-stone-500 hover:text-stone-800 underline">
          מדיניות שירות לקוחות
        </Link>
        {!userCategories && (
          <Link href="/dashboard/staff" className="text-sm text-stone-500 hover:text-stone-800 underline">
            ניהול צוות
          </Link>
        )}
        <form action={logout} className="flex items-center gap-2 text-sm text-stone-500">
          {userEmail && <span>מחוברת כ-{userEmail}</span>}
          <button type="submit" className="underline hover:text-stone-800">
            התנתקות
          </button>
        </form>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo-mark.png" alt="פרקטי" width={48} height={48} className="h-12 w-auto" priority />
          <div>
            <h1 className="text-2xl font-bold">שרות לקוחות - פרקטי</h1>
            <p className="text-stone-500 text-sm mt-1">
              {allStatuses?.length ?? 0} פניות במערכת
              {counts.new ? ` · ${counts.new} חדשות ממתינות` : ""}
              {totalCalls ? ` · ${totalCalls} שיחות נוספות מוזגו לפניות פתוחות` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-full ring-1 ${STATUSES[s].classes}`}
            >
              {STATUSES[s].label} · {counts[s] ?? 0}
            </span>
          ))}
          <Link
            href="/dashboard/new"
            className="px-3 py-1.5 rounded-lg bg-stone-800 text-white hover:bg-stone-700"
          >
            + פנייה חדשה
          </Link>
        </div>
      </header>

      <FilterBar
        categories={CATEGORIES}
        current={{ status, category, q, phone, from, to }}
        lockedCategories={userCategories ?? undefined}
      />

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-4 mt-4">
          שגיאה בטעינת הפניות: {error.message}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {tickets?.map((t) => {
          const customer = Array.isArray(t.customers) ? t.customers[0] : t.customers;
          return (
            <li key={t.id}>
              <TicketRow ticket={t} customer={customer ?? null} />
            </li>
          );
        })}
        {tickets?.length === 0 && (
          <li className="text-center text-stone-500 py-16 bg-white rounded-xl border border-dashed border-stone-300">
            אין פניות שתואמות את הסינון. נקי את הסינון או המתיני לשיחה הבאה.
          </li>
        )}
      </ul>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 mt-6 text-sm flex-wrap">
          <Link
            href={pageHref({ status, category, q, phone, from, to }, page - 1)}
            aria-disabled={page <= 1}
            className={`px-3 py-1.5 rounded-lg border border-stone-300 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-stone-100"
            }`}
          >
            הקודם
          </Link>

          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`gap-${i}`} className="px-2 text-stone-400">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={pageHref({ status, category, q, phone, from, to }, p)}
                aria-current={p === page ? "page" : undefined}
                className={`px-3 py-1.5 rounded-lg border ${
                  p === page
                    ? "border-stone-800 bg-stone-800 text-white"
                    : "border-stone-300 hover:bg-stone-100"
                }`}
              >
                {p}
              </Link>
            )
          )}

          <Link
            href={pageHref({ status, category, q, phone, from, to }, page + 1)}
            aria-disabled={page >= totalPages}
            className={`px-3 py-1.5 rounded-lg border border-stone-300 ${
              page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-stone-100"
            }`}
          >
            הבא
          </Link>
        </nav>
      )}
    </main>
  );
}

/** מחזיר את מספרי העמודים שיוצגו בפאגינציה, עם "..." לדילוגים */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

function pageHref(current: Search, page: number): string {
  const params = new URLSearchParams();
  if (current.status) params.set("status", current.status);
  if (current.category) params.set("category", current.category);
  if (current.q) params.set("q", current.q);
  if (current.phone) params.set("phone", current.phone);
  if (current.from) params.set("from", current.from);
  if (current.to) params.set("to", current.to);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}
