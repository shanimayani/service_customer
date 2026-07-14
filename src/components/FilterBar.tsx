"use client";

import { useRouter, usePathname } from "next/navigation";
import { STATUSES, categoryColor, type Status } from "@/lib/constants";

type Props = {
  categories: string[];
  current: { status?: string; category?: string; q?: string; phone?: string };
  /** אם קיים, המשתמש מוגבל לקטגוריה אחת — מציגים תג קבוע במקום בחירה */
  lockedCategory?: string;
};

export default function FilterBar({ categories, current, lockedCategory }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function update(patch: Partial<Props["current"]>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.q) params.set("q", next.q);
    if (next.phone) params.set("phone", next.phone);
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

      {lockedCategory ? (
        <span
          className={`text-sm px-3 py-1.5 rounded-lg ring-1 ${categoryColor(lockedCategory).badge}`}
        >
          {lockedCategory}
        </span>
      ) : (
        <select
          value={current.category ?? ""}
          onChange={(e) => update({ category: e.target.value || undefined })}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm bg-white"
        >
          <option value="">כל הנושאים</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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

      {(current.status || current.category || current.q || current.phone) && (
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
