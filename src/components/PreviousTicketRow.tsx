"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTicketPreview } from "@/app/dashboard/[id]/actions";
import { STATUSES, categoryColor, type Status } from "@/lib/constants";

type Preview = {
  id: string;
  subject: string;
  status: string;
  category: string;
  created_at: string;
  call_summary: string | null;
};

export default function PreviousTicketRow({
  ticketId,
  subject,
  status,
  createdAt,
}: {
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openModal() {
    setOpen(true);
    setPreview(null);
    getTicketPreview(ticketId).then(setPreview);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 text-sm text-start"
      >
        <span
          className={`text-xs px-2 py-0.5 rounded-full ring-1 ${STATUSES[status as Status].classes}`}
        >
          {STATUSES[status as Status].label}
        </span>
        <span>{subject}</span>
        <span className="ms-auto text-stone-400" dir="ltr">
          {new Date(createdAt).toLocaleDateString("he-IL", {
            timeZone: "Asia/Jerusalem",
          })}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!preview ? (
              <p className="text-sm text-stone-400">טוען…</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{preview.subject}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${
                      STATUSES[preview.status as Status].classes
                    }`}
                  >
                    {STATUSES[preview.status as Status].label}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${
                      categoryColor(preview.category).badge
                    }`}
                  >
                    {preview.category}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1" dir="ltr">
                  {new Date(preview.created_at).toLocaleString("he-IL", {
                    timeZone: "Asia/Jerusalem",
                  })}
                </p>
                <p className="bg-stone-50 rounded-xl p-4 mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {preview.call_summary ?? "אין סיכום לשיחה זו."}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <Link
                    href={`/dashboard/${preview.id}`}
                    className="text-sm text-sky-700 hover:underline"
                  >
                    מעבר לדף המלא של הפנייה ←
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm text-stone-500 hover:underline"
                  >
                    סגירה
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
