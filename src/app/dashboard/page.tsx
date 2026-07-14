import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { STATUSES, CATEGORIES, type Status } from "@/lib/constants";
import FilterBar from "@/components/FilterBar";
import TicketRow from "@/components/TicketRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type Search = { status?: string; category?: string; q?: string; phone?: string; page?: string };

/**
 * כשללקוח יש כמה פניות פתוחות (חדשה/בטיפול) בו-זמנית — למשל כמה שיחות
 * מאותו מספר טלפון על אותו נושא שעדיין לא טופל — מציגים בדשבורד רק את
 * הפנייה הפתוחה הראשונה שלו; השאר נגישות דרך "פניות קודמות" בתוך הפנייה עצמה.
 */
function hideDuplicateOpenTickets<
  T extends { id: string; customer_id: string; status: string; created_at: string }
>(rows: T[]): T[] {
  const openByCustomer = new Map<string, T[]>();
  for (const t of rows) {
    if (t.status === "new" || t.status === "in_progress") {
      const arr = openByCustomer.get(t.customer_id) ?? [];
      arr.push(t);
      openByCustomer.set(t.customer_id, arr);
    }
  }

  const hiddenIds = new Set<string>();
  for (const arr of openByCustomer.values()) {
    if (arr.length < 2) continue;
    const sorted = [...arr].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const extra of sorted.slice(1)) hiddenIds.add(extra.id);
  }

  return rows.filter((t) => !hiddenIds.has(t.id));
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { status, category, q, phone, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const db = supabaseAdmin();

  const phoneDigits = phone ? phone.replace(/\D/g, "") : "";

  let query = db
    .from("tickets")
    .select(
      "id, subject, category, status, created_at, call_summary, customer_id, customers!inner(name, phone)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status && status in STATUSES) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`subject.ilike.%${q}%,call_summary.ilike.%${q}%`);
  if (phoneDigits) query = query.ilike("customers.phone", `%${phoneDigits}%`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: rawTickets, error, count } = await query;
  const tickets = rawTickets ? hideDuplicateOpenTickets(rawTickets) : rawTickets;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // ספירות לפי סטטוס לכותרת
  const { data: allStatuses } = await db.from("tickets").select("status");
  const counts: Record<string, number> = {};
  for (const t of allStatuses ?? []) counts[t.status] = (counts[t.status] ?? 0) + 1;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">מוקד פניות</h1>
          <p className="text-stone-500 text-sm mt-1">
            {allStatuses?.length ?? 0} פניות במערכת
            {counts.new ? ` · ${counts.new} חדשות ממתינות` : ""}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-full ring-1 ${STATUSES[s].classes}`}
            >
              {STATUSES[s].label} · {counts[s] ?? 0}
            </span>
          ))}
        </div>
      </header>

      <FilterBar
        categories={CATEGORIES}
        current={{ status, category, q, phone }}
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
        <nav className="flex items-center justify-center gap-2 mt-6 text-sm">
          <Link
            href={pageHref({ status, category, q, phone }, page - 1)}
            aria-disabled={page <= 1}
            className={`px-3 py-1.5 rounded-lg border border-stone-300 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-stone-100"
            }`}
          >
            הקודם
          </Link>
          <span className="text-stone-500">
            עמוד {page} מתוך {totalPages}
          </span>
          <Link
            href={pageHref({ status, category, q, phone }, page + 1)}
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

function pageHref(current: Search, page: number): string {
  const params = new URLSearchParams();
  if (current.status) params.set("status", current.status);
  if (current.category) params.set("category", current.category);
  if (current.q) params.set("q", current.q);
  if (current.phone) params.set("phone", current.phone);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}
