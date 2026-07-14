import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategory } from "@/lib/auth";
import { CATEGORIES, categoryColor } from "@/lib/constants";
import { createStaffAccount } from "./actions";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const userCategory = await getUserCategory();
  if (userCategory) notFound();

  const { error, success } = await searchParams;

  const db = supabaseAdmin();
  const {
    data: { users },
  } = await db.auth.admin.listUsers();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-sm text-stone-500 hover:underline">
        → חזרה לדשבורד
      </Link>

      <h1 className="text-2xl font-bold mt-3 mb-6">ניהול צוות</h1>

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-3 mb-4 text-sm">{error}</p>
      )}
      {success && (
        <p className="text-emerald-700 bg-emerald-50 rounded-lg p-3 mb-4 text-sm">
          החשבון נוצר בהצלחה.
        </p>
      )}

      <section className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-stone-500 mb-3">משתמשים קיימים</h2>
        <ul className="divide-y divide-stone-100">
          {users.map((u) => {
            const cat = (u.app_metadata as { category?: string } | undefined)?.category;
            return (
              <li key={u.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm">{u.email}</span>
                {cat ? (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${categoryColor(cat).badge}`}>
                    {cat}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full ring-1 bg-stone-100 text-stone-600 ring-stone-200">
                    גישה מלאה
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-white rounded-xl border border-stone-200 p-4">
        <h2 className="text-sm font-semibold text-stone-500 mb-3">הוספת איש/אשת צוות</h2>
        <form action={createStaffAccount} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-stone-600 mb-1">
              אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-stone-600 mb-1">
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm text-stone-600 mb-1">
              הרשאת גישה
            </label>
            <select
              id="category"
              name="category"
              defaultValue=""
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              <option value="">ללא הגבלה (גישה מלאה)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-stone-800 text-white hover:bg-stone-700"
          >
            יצירת חשבון
          </button>
        </form>
      </section>
    </main>
  );
}
