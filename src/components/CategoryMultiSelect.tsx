"use client";

import { useEffect, useRef, useState } from "react";
import { categoryColor } from "@/lib/constants";

export default function CategoryMultiSelect({
  categories,
  selected,
  onChange,
  emptyLabel = "כל הנושאים",
}: {
  categories: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function toggle(category: string) {
    const next = selected.includes(category)
      ? selected.filter((c) => c !== category)
      : [...selected, category];
    onChange(next);
  }

  const label =
    selected.length === 0
      ? emptyLabel
      : selected.length === 1
      ? selected[0]
      : `${selected.length} נושאים נבחרו`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm bg-white hover:bg-stone-50"
      >
        {label}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-stone-300 rounded-lg shadow-lg p-1.5">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-start text-sm text-stone-500 hover:text-stone-800 px-2 py-1 hover:bg-stone-50 rounded"
            >
              נקה בחירה
            </button>
          )}
          {categories.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-stone-50 rounded cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(c)}
                onChange={() => toggle(c)}
                className="accent-stone-800"
              />
              <span className={`px-1.5 py-0.5 rounded ring-1 ${categoryColor(c).badge}`}>{c}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
