"use client";

import { CATEGORIES, categoryColor } from "@/lib/constants";
import { updateCategory } from "@/app/dashboard/[id]/actions";

export default function CategoryButtons({
  ticketId,
  currentCategory,
}: {
  ticketId: string;
  currentCategory: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {CATEGORIES.map((c) => (
        <form
          key={c}
          action={updateCategory.bind(null, ticketId, c)}
          onSubmit={(e) => {
            if (!confirm(`להעביר את הפנייה לקטגוריית "${c}"?`)) {
              e.preventDefault();
            }
          }}
        >
          <button
            disabled={c === currentCategory}
            className={`text-xs px-2.5 py-1 rounded-lg ring-1 transition-colors ${
              c === currentCategory
                ? categoryColor(c).badge
                : "bg-white ring-stone-200 text-stone-500 hover:ring-stone-400"
            }`}
          >
            {c}
          </button>
        </form>
      ))}
    </div>
  );
}
