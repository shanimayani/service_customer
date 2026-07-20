"use client";

import { useState, useTransition } from "react";
import { CATEGORIES, categoryColor } from "@/lib/constants";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import { updateStaffCategories } from "@/app/dashboard/staff/actions";

export default function EditStaffCategories({
  userId,
  categories,
}: {
  userId: string;
  categories: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(categories);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1 justify-end">
          {categories.length ? (
            categories.map((c) => (
              <span
                key={c}
                className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${categoryColor(c).badge}`}
              >
                {c}
              </span>
            ))
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full ring-1 bg-stone-100 text-stone-600 ring-stone-200">
              גישה מלאה
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected(categories);
            setEditing(true);
          }}
          className="text-sm text-stone-400 hover:text-stone-700"
          title="עריכת הרשאות"
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CategoryMultiSelect
        categories={CATEGORIES}
        selected={selected}
        onChange={setSelected}
        emptyLabel="ללא הגבלה (גישה מלאה)"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await updateStaffCategories(userId, selected);
            setEditing(false);
          })
        }
        className="text-sm bg-stone-800 text-white rounded-lg px-3 py-1.5 hover:bg-stone-700 disabled:opacity-50"
      >
        שמירה
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setEditing(false)}
        className="text-sm text-stone-500 hover:underline"
      >
        ביטול
      </button>
    </div>
  );
}
