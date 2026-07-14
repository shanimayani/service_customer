"use client";

import { useState, useTransition } from "react";
import { updateSubject } from "@/app/dashboard/[id]/actions";

export default function EditableSubject({
  ticketId,
  subject,
}: {
  ticketId: string;
  subject: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(subject);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{subject}</h1>
        <button
          type="button"
          onClick={() => {
            setValue(subject);
            setEditing(true);
          }}
          className="text-sm text-stone-400 hover:text-stone-700"
          title="שינוי נושא"
        >
          ✏️
        </button>
      </div>
    );
  }

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === subject) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateSubject(ticketId, trimmed);
      setEditing(false);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={isPending}
        className="text-xl font-bold rounded-lg border border-stone-300 px-2 py-1 flex-1"
      />
      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="text-sm bg-stone-800 text-white rounded-lg px-3 py-1.5 hover:bg-stone-700"
      >
        שמירה
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={isPending}
        className="text-sm text-stone-500 hover:underline"
      >
        ביטול
      </button>
    </div>
  );
}
