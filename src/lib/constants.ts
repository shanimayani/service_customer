export const STATUSES = {
  new: { label: "חדשה", classes: "bg-sky-100 text-sky-800 ring-sky-200" },
  in_progress: { label: "בטיפול", classes: "bg-amber-100 text-amber-800 ring-amber-200" },
  waiting: { label: "ממתינה ללקוח", classes: "bg-violet-100 text-violet-800 ring-violet-200" },
  closed: { label: "טופל", classes: "bg-stone-200 text-stone-600 ring-stone-300" },
  auto_closed: { label: "טופל אוטומטית", classes: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
} as const;

export type Status = keyof typeof STATUSES;

// עדכני לקטגוריות של העסק שלך — מומלץ שיתאימו לקטגוריות שמוגדרות אצל Genie
export const CATEGORIES = ["תמיכה", "חיוב", "מכירות", "הזמנות", "אבידות", "כללי"];

const CATEGORY_COLORS: Record<string, { badge: string; border: string }> = {
  "תמיכה": { badge: "bg-sky-100 text-sky-800 ring-sky-200", border: "border-sky-300" },
  "חיוב": { badge: "bg-rose-100 text-rose-800 ring-rose-200", border: "border-rose-300" },
  "מכירות": { badge: "bg-emerald-100 text-emerald-800 ring-emerald-200", border: "border-emerald-300" },
  "הזמנות": { badge: "bg-amber-100 text-amber-800 ring-amber-200", border: "border-amber-300" },
  "אבידות": { badge: "bg-violet-100 text-violet-800 ring-violet-200", border: "border-violet-300" },
  "כללי": { badge: "bg-stone-100 text-stone-600 ring-stone-200", border: "border-stone-300" },
};

const DEFAULT_CATEGORY_COLOR = { badge: "bg-stone-100 text-stone-600 ring-stone-200", border: "border-stone-300" };

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
}
