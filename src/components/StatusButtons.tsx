"use client";

import { STATUSES, type Status } from "@/lib/constants";
import { updateStatus } from "@/app/dashboard/[id]/actions";

export default function StatusButtons({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {(Object.keys(STATUSES) as Status[]).map((s) => (
        <form
          key={s}
          action={updateStatus.bind(null, ticketId, s)}
          onSubmit={(e) => {
            if (!confirm(`לשנות את סטטוס הפנייה ל"${STATUSES[s].label}"?`)) {
              e.preventDefault();
            }
          }}
        >
          <button
            disabled={s === currentStatus}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              s === currentStatus
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-white border-stone-300 hover:border-stone-500"
            }`}
          >
            {STATUSES[s].label}
          </button>
        </form>
      ))}
    </div>
  );
}
