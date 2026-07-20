import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategories, categoriesFromAppMetadata } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { createStaffAccount } from "./actions";
import CategoriesFormField from "@/components/CategoriesFormField";
import EditStaffCategories from "@/components/EditStaffCategories";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const userCategories = await getUserCategories();
  if (userCategories) notFound();

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
            const cats = categoriesFromAppMetadata(u.app_metadata) ?? [];
            return (
              <li key={u.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm">{u.email}</span>
                <EditStaffCategories userId={u.id} categories={cats} />
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
            <span className="block text-sm text-stone-600 mb-1">הרשאת גישה</span>
            <CategoriesFormField name="categories" categories={CATEGORIES} />
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
