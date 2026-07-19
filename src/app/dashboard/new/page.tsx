import { getUserCategory } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { MAX_ATTACHMENTS_PER_TICKET } from "@/lib/attachments";
import BackToListLink from "@/components/BackToListLink";
import MultiFileInput from "@/components/MultiFileInput";
import { createTicket } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const userCategory = await getUserCategory();

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <BackToListLink />

      <h1 className="text-2xl font-bold mt-3 mb-6">פנייה חדשה</h1>

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-3 mb-4 text-sm">{error}</p>
      )}

      <form action={createTicket} className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm text-stone-600 mb-1">
            טלפון הלקוח *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm text-stone-600 mb-1">
            שם הלקוח
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-stone-600 mb-1">
            אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm text-stone-600 mb-1">
            נושא הפנייה *
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {userCategory ? (
          <div>
            <span className="block text-sm text-stone-600 mb-1">קטגוריה</span>
            <span className="text-sm px-3 py-1.5 rounded-lg ring-1 bg-stone-100 text-stone-600 ring-stone-200">
              {userCategory}
            </span>
          </div>
        ) : (
          <div>
            <label htmlFor="category" className="block text-sm text-stone-600 mb-1">
              קטגוריה
            </label>
            <select
              id="category"
              name="category"
              defaultValue="כללי"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="note" className="block text-sm text-stone-600 mb-1">
            תיאור / הערה ראשונית
          </label>
          <textarea
            id="note"
            name="note"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <div>
          <label htmlFor="files" className="block text-sm text-stone-600 mb-1">
            קבצים מצורפים (עד {MAX_ATTACHMENTS_PER_TICKET})
          </label>
          <MultiFileInput id="files" name="files" max={MAX_ATTACHMENTS_PER_TICKET} />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-stone-800 text-white hover:bg-stone-700"
        >
          יצירת פנייה
        </button>
      </form>
    </main>
  );
}
