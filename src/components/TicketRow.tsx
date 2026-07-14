"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { displayPhone } from "@/lib/phone";
import { STATUSES, CATEGORIES, categoryColor, type Status } from "@/lib/constants";
import { updateStatus, updateCategory } from "@/app/dashboard/[id]/actions";
import ConfirmDialog from "@/components/ConfirmDialog";

type Props = {
  ticket: {
    id: string;
    subject: string;
    category: string;
    status: string;
    created_at: string;
    call_summary: string | null;
  };
  customer: { name: string | null; phone: string | null } | null;
};

export default function TicketRow({ ticket, customer }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const st = STATUSES[ticket.status as Status];

  function stop(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/${ticket.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/dashboard/${ticket.id}`);
      }}
      className={`block bg-white rounded-xl border-2 ${categoryColor(ticket.category).border} p-4 hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={ticket.status}
          disabled={isPending}
          onClick={stop}
          onChange={(e) => {
            const value = e.target.value;
            startTransition(() => updateStatus(ticket.id, value));
          }}
          className={`text-xs px-2 py-0.5 rounded-full ring-1 ${st.classes}`}
        >
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUSES[s].label}
            </option>
          ))}
        </select>
        <span className="font-semibold">{ticket.subject}</span>
        <select
          ref={categorySelectRef}
          value={ticket.category}
          disabled={isPending}
          onClick={stop}
          onChange={(e) => {
            const value = e.target.value;
            if (value === ticket.category) return;
            setPendingCategory(value);
          }}
          className={`text-xs px-2 py-0.5 rounded-full ring-1 ${categoryColor(ticket.category).badge}`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ms-auto text-sm text-stone-500" dir="ltr">
          {new Date(ticket.created_at).toLocaleString("he-IL", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "Asia/Jerusalem",
          })}
        </span>
      </div>
      <p className="text-sm text-stone-600 mt-2 line-clamp-2">{ticket.call_summary}</p>
      <p className="text-xs text-stone-400 mt-2">
        {customer?.name ?? "לקוח ללא שם"} ·{" "}
        <span dir="ltr">{displayPhone(customer?.phone ?? "")}</span>
      </p>

      <ConfirmDialog
        open={pendingCategory !== null}
        title="שינוי קטגוריה"
        message={`להעביר את הפנייה לקטגוריית "${pendingCategory}"?`}
        pending={isPending}
        onCancel={() => {
          if (categorySelectRef.current) categorySelectRef.current.value = ticket.category;
          setPendingCategory(null);
        }}
        onConfirm={() => {
          const value = pendingCategory;
          if (!value) return;
          startTransition(() => updateCategory(ticket.id, value));
          setPendingCategory(null);
        }}
      />
    </div>
  );
}
