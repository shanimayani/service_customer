"use client";

import { useRouter } from "next/navigation";

/** חזרה לרשימת הפניות תוך שמירה על הסינון/העמוד שהיו פעילים (history.back), ולא איפוס לדשבורד ריק. */
export default function BackToListLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm text-stone-500 hover:underline"
    >
      → חזרה לכל הפניות
    </button>
  );
}
