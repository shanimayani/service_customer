import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { displayPhone } from "@/lib/phone";
import { STATUSES, CATEGORIES, type Status } from "@/lib/constants";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

type Search = { status?: string; category?: string; q?: string };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { status, category, q } = await searchParams;
  const db = supabaseAdmin();

  let query = db
    .from("tickets")
    .select("id, subject, category, status, created_at, call_summary, customers(name, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status in STATUSES) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`subject.ilike.%${q}%,call_summary.ilike.%${q}%`);

  const { data: tickets, error } = await query;

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
        current={{ status, category, q }}
      />

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-4 mt-4">
          שגיאה בטעינת הפניות: {error.message}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {tickets?.map((t) => {
          const st = STATUSES[t.status as Status];
          const customer = Array.isArray(t.customers) ? t.customers[0] : t.customers;
          return (
            <li key={t.id}>
              <Link
                href={`/dashboard/${t.id}`}
                className="block bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-400 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${st.classes}`}>
                    {st.label}
                  </span>
                  <span className="font-semibold">{t.subject}</span>
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                    {t.category}
                  </span>
                  <span className="ms-auto text-sm text-stone-500" dir="ltr">
                    {new Date(t.created_at).toLocaleString("he-IL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm text-stone-600 mt-2 line-clamp-2">
                  {t.call_summary}
                </p>
                <p className="text-xs text-stone-400 mt-2">
                  {customer?.name ?? "לקוח ללא שם"} ·{" "}
                  <span dir="ltr">{displayPhone(customer?.phone ?? "")}</span>
                </p>
              </Link>
            </li>
          );
        })}
        {tickets?.length === 0 && (
          <li className="text-center text-stone-500 py-16 bg-white rounded-xl border border-dashed border-stone-300">
            אין פניות שתואמות את הסינון. נקי את הסינון או המתיני לשיחה הבאה.
          </li>
        )}
      </ul>
    </main>
  );
}
