"use client";

import { useState, useTransition } from "react";
import { updatePolicy } from "@/app/dashboard/policy/actions";

export default function PolicyEditor({
  initialContent,
  updatedAt,
  updatedBy,
}: {
  initialContent: string;
  updatedAt: string | null;
  updatedBy: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updatePolicy(content);
      setEditing(false);
    });
  }

  return (
    <div>
      {editing ? (
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={20}
          className="w-full rounded-xl border border-stone-300 p-4 leading-relaxed whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      ) : (
        <p className="bg-stone-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap min-h-32">
          {content || "אין עדיין תוכן מדיניות. לחצו על עריכה כדי להוסיף."}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div>
          {editing ? (
            <div className="flex gap-2">
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
                onClick={() => {
                  setContent(initialContent);
                  setEditing(false);
                }}
                disabled={isPending}
                className="text-sm text-stone-500 hover:underline"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-stone-500 hover:text-stone-800 underline"
            >
              ✏️ עריכה
            </button>
          )}
        </div>
        {updatedAt && (
          <p className="text-xs text-stone-400">
            עודכן לאחרונה {new Date(updatedAt).toLocaleString("he-IL")}
            {updatedBy && ` על ידי ${updatedBy}`}
          </p>
        )}
      </div>
    </div>
  );
}
