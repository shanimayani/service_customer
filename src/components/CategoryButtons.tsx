"use client";

import { useState, useTransition } from "react";
import { CATEGORIES, categoryColor } from "@/lib/constants";
import { updateCategory } from "@/app/dashboard/[id]/actions";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function CategoryButtons({
  ticketId,
  currentCategory,
}: {
  ticketId: string;
  currentCategory: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            disabled={c === currentCategory}
            onClick={() => setPending(c)}
            className={`text-xs px-2.5 py-1 rounded-lg ring-1 transition-colors ${
              c === currentCategory
                ? categoryColor(c).badge
                : "bg-white ring-stone-200 text-stone-500 hover:ring-stone-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="שינוי קטגוריה"
        message={`להעביר את הפנייה לקטגוריית "${pending}"?`}
        pending={isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const category = pending;
          if (!category) return;
          startTransition(() => updateCategory(ticketId, category));
          setPending(null);
        }}
      />
    </>
  );
}
