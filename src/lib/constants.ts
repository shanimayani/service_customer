export const STATUSES = {
  new: { label: "חדשה", classes: "bg-sky-100 text-sky-800 ring-sky-200" },
  in_progress: { label: "בטיפול", classes: "bg-amber-100 text-amber-800 ring-amber-200" },
  waiting: { label: "ממתינה ללקוח", classes: "bg-violet-100 text-violet-800 ring-violet-200" },
  closed: { label: "סגורה", classes: "bg-stone-200 text-stone-600 ring-stone-300" },
} as const;

export type Status = keyof typeof STATUSES;

// עדכני לקטגוריות של העסק שלך — מומלץ שיתאימו לקטגוריות שמוגדרות אצל Genie
export const CATEGORIES = ["תמיכה", "חיוב", "מכירות", "הזמנות", "כללי"];
