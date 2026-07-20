"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { STATUSES, categoryColor, type Status } from "@/lib/constants";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";

type Props = {
  categories: string[];
  current: { status?: string; category?: string; q?: string; phone?: string; from?: string; to?: string };
  /** אם קיים, המשתמש מוגבל לקטגוריות האלה — מציגים תגים קבועים במקום בחירה */
  lockedCategories?: string[];
};

export default function FilterBar({ categories, current, lockedCategories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [fromValue, setFromValue] = useState(current.from ?? "");
  const [toValue, setToValue] = useState(current.to ?? "");

  useEffect(() => {
    setFromValue(current.from ?? "");
    setToValue(current.to ?? "");
  }, [current.from, current.to]);

  function update(patch: Partial<Props["current"]>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.q) params.set("q", next.q);
    if (next.phone) params.set("phone", next.phone);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-stone-200 p-3">
      <select
        value={current.status ?? ""}
        onChange={(e) => update({ status: e.target.value || undefined })}
        className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm bg-white"
      >
        <option value="">כל הסטטוסים</option>
        {(Object.keys(STATUSES) as Status[]).map((s) => (
          <option key={s} value={s}>
            {STATUSES[s].label}
          </option>
        ))}
      </select>

      {lockedCategories && lockedCategories.length ? (
        <div className="flex flex-wrap gap-1.5">
          {lockedCategories.map((c) => (
            <span key={c} className={`text-sm px-3 py-1.5 rounded-lg ring-1 ${categoryColor(c).badge}`}>
              {c}
            </span>
          ))}
        </div>
      ) : (
        <CategoryMultiSelect
          categories={categories}
          selected={current.category ? current.category.split(",") : []}
          onChange={(selected) => update({ category: selected.length ? selected.join(",") : undefined })}
        />
      )}

      <input
        type="search"
        placeholder="חיפוש בנושא או בסיכום…"
        defaultValue={current.q ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            update({ q: (e.target as HTMLInputElement).value || undefined });
        }}
        className="flex-1 min-w-48 rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
      />

      <input
        type="search"
        dir="ltr"
        placeholder="חיפוש לפי טלפון…"
        defaultValue={current.phone ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            update({ phone: (e.target as HTMLInputElement).value || undefined });
        }}
        className="w-40 rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
      />

      <div className="flex items-center gap-1.5 text-sm">
        <label className="text-stone-500">מתאריך</label>
        <input
          type="date"
          value={fromValue}
          onChange={(e) => setFromValue(e.target.value)}
          onBlur={() => update({ from: fromValue || undefined, to: toValue || undefined })}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        />
        <label className="text-stone-500">עד</label>
        <input
          type="date"
          value={toValue}
          onChange={(e) => setToValue(e.target.value)}
          onBlur={() => update({ from: fromValue || undefined, to: toValue || undefined })}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        />
      </div>

      {(current.status || current.category || current.q || current.phone || current.from || current.to) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-stone-500 hover:text-stone-800 underline"
        >
          נקה סינון
        </button>
      )}
    </div>
  );
}
