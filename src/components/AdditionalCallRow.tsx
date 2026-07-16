"use client";

import { useState } from "react";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdditionalCallRow({
  callSummary,
  callTranscript,
  callRecordingUrl,
  callDurationSeconds,
  source,
  createdAt,
}: {
  callSummary: string | null;
  callTranscript: string | null;
  callRecordingUrl: string | null;
  callDurationSeconds: number | null;
  source: string;
  createdAt: string;
}) {
  const [open, setOpen] = useState(false);
  const excerpt = callSummary?.slice(0, 60) ?? "אין סיכום לשיחה זו";

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 text-start"
      >
        {source === "genie" && (
          <span className="text-xs text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full ring-1 ring-violet-200 shrink-0">
            Genie
          </span>
        )}
        <span className="truncate">
          {excerpt}
          {callSummary && callSummary.length > 60 ? "…" : ""}
        </span>
        <span className="ms-auto text-stone-400 shrink-0" dir="ltr">
          {new Date(createdAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          <p className="bg-stone-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
            {callSummary ?? "אין סיכום לשיחה זו."}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
            {callRecordingUrl && (
              <a href={callRecordingUrl} className="text-sky-700 hover:underline" target="_blank">
                האזנה להקלטת השיחה
              </a>
            )}
            {callDurationSeconds != null && (
              <span className="text-stone-400" dir="ltr">
                משך שיחה: {formatDuration(callDurationSeconds)}
              </span>
            )}
          </div>
          {callTranscript && (
            <details className="mt-2 group">
              <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-800 select-none">
                תמלול מלא של השיחה
              </summary>
              <p className="bg-stone-50 rounded-xl p-3 mt-2 leading-relaxed whitespace-pre-wrap text-xs">
                {callTranscript}
              </p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
