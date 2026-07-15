export const STATUSES = {
  new: { label: "חדשה", classes: "bg-sky-100 text-sky-800 ring-sky-200" },
  in_progress: { label: "בטיפול", classes: "bg-amber-100 text-amber-800 ring-amber-200" },
  waiting: { label: "ממתינה ללקוח", classes: "bg-violet-100 text-violet-800 ring-violet-200" },
  closed: { label: "טופל", classes: "bg-stone-200 text-stone-600 ring-stone-300" },
  auto_closed: { label: "טופל אוטומטית", classes: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  dismissed: { label: "נסגר", classes: "bg-slate-200 text-slate-700 ring-slate-300" },
} as const;

export type Status = keyof typeof STATUSES;

// עדכני לקטגוריות של העסק שלך — מומלץ שיתאימו לקטגוריות שמוגדרות אצל Genie
export const CATEGORIES = ["תמיכה", "חיוב", "אחריות", "הזמנות", "אבידות", "כללי", "מחלקת חשמל", "מחלקת ריהוט", "מחלקת אופטיקה"];

const CATEGORY_COLORS: Record<string, { badge: string; border: string }> = {
  "תמיכה": { badge: "bg-sky-100 text-sky-800 ring-sky-200", border: "border-sky-300" },
  "חיוב": { badge: "bg-rose-100 text-rose-800 ring-rose-200", border: "border-rose-300" },
  "אחריות": { badge: "bg-emerald-100 text-emerald-800 ring-emerald-200", border: "border-emerald-300" },
  "הזמנות": { badge: "bg-amber-100 text-amber-800 ring-amber-200", border: "border-amber-300" },
  "אבידות": { badge: "bg-violet-100 text-violet-800 ring-violet-200", border: "border-violet-300" },
  "כללי": { badge: "bg-stone-100 text-stone-600 ring-stone-200", border: "border-stone-300" },
  "מחלקת חשמל": { badge: "bg-indigo-100 text-indigo-800 ring-indigo-200", border: "border-indigo-300" },
  "מחלקת ריהוט": { badge: "bg-teal-100 text-teal-800 ring-teal-200", border: "border-teal-300" },
  "מחלקת אופטיקה": { badge: "bg-pink-100 text-pink-800 ring-pink-200", border: "border-pink-300" },
};

const DEFAULT_CATEGORY_COLOR = { badge: "bg-stone-100 text-stone-600 ring-stone-200", border: "border-stone-300" };

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
}
