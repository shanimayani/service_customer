import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategory } from "@/lib/auth";
import { displayPhone } from "@/lib/phone";
import { STATUSES, CATEGORIES, categoryColor, type Status } from "@/lib/constants";
import { addNote, updateStatus, updateCategory, uploadAttachment } from "./actions";
import AttachmentLink from "@/components/AttachmentLink";
import EditableSubject from "@/components/EditableSubject";
import PreviousTicketRow from "@/components/PreviousTicketRow";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();
  const userCategory = await getUserCategory();

  const { data: ticket } = await db
    .from("tickets")
    .select("*, customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();
  if (userCategory && ticket.category !== userCategory) notFound();
  const customer = Array.isArray(ticket.customers)
    ? ticket.customers[0]
    : ticket.customers;

  let previousQuery = db
    .from("tickets")
    .select("id, subject, status, created_at")
    .eq("customer_id", customer.id)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (userCategory) previousQuery = previousQuery.eq("category", userCategory);

  const [{ data: notes }, { data: attachments }, { data: previous }] =
    await Promise.all([
      db.from("notes").select("*").eq("ticket_id", id).order("created_at"),
      db.from("attachments").select("*").eq("ticket_id", id).order("created_at"),
      // קישור פניות קודמות: כל הפניות של אותו לקוח (מוגבל לקטגוריה של המשתמש, אם יש)
      previousQuery,
    ]);

  const st = STATUSES[ticket.status as Status];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-sm text-stone-500 hover:underline">
        → חזרה לכל הפניות
      </Link>

      <div className={`bg-white rounded-2xl border-2 ${categoryColor(ticket.category).border} p-6 mt-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <EditableSubject ticketId={ticket.id} subject={ticket.subject} />
          <span className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${st.classes}`}>
            {st.label}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full ring-1 ${categoryColor(ticket.category).badge}`}>
            {ticket.category}
          </span>
        </div>

        <p className="text-sm text-stone-500 mt-2">
          {customer?.name ?? "לקוח ללא שם"} ·{" "}
          <span dir="ltr">{displayPhone(customer?.phone ?? "")}</span> · נפתחה{" "}
          {new Date(ticket.created_at).toLocaleString("he-IL", {
            timeZone: "Asia/Jerusalem",
          })}
        </p>

        {/* שינוי סטטוס */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <form key={s} action={updateStatus.bind(null, ticket.id, s)}>
              <button
                disabled={s === ticket.status}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  s === ticket.status
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white border-stone-300 hover:border-stone-500"
                }`}
              >
                {STATUSES[s].label}
              </button>
            </form>
          ))}
        </div>

        {/* שינוי קטגוריה */}
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((c) => (
            <form key={c} action={updateCategory.bind(null, ticket.id, c)}>
              <button
                disabled={c === ticket.category}
                className={`text-xs px-2.5 py-1 rounded-lg ring-1 transition-colors ${
                  c === ticket.category
                    ? categoryColor(c).badge
                    : "bg-white ring-stone-200 text-stone-500 hover:ring-stone-400"
                }`}
              >
                {c}
              </button>
            </form>
          ))}
        </div>

        {/* סיכום השיחה */}
        <section className="mt-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-stone-500">
              סיכום השיחה מהמזכירה
            </h2>
            {ticket.source === "genie" && (
              <span className="text-xs text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full ring-1 ring-violet-200">
                נקלט אוטומטית מ-Genie
              </span>
            )}
          </div>
          <p className="bg-stone-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
            {ticket.call_summary ?? "אין סיכום לשיחה זו."}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            {ticket.call_recording_url && (
              <a
                href={ticket.call_recording_url}
                className="text-sky-700 hover:underline"
                target="_blank"
              >
                האזנה להקלטת השיחה
              </a>
            )}
            {ticket.call_duration_seconds != null && (
              <span className="text-stone-400" dir="ltr">
                משך שיחה: {formatDuration(ticket.call_duration_seconds)}
              </span>
            )}
          </div>

          {ticket.call_transcript && (
            <details className="mt-3 group">
              <summary className="text-sm text-stone-500 cursor-pointer hover:text-stone-800 select-none">
                תמלול מלא של השיחה
              </summary>
              <p className="bg-stone-50 rounded-xl p-4 mt-2 leading-relaxed whitespace-pre-wrap text-sm">
                {ticket.call_transcript}
              </p>
            </details>
          )}

          {ticket.genie_call_id && (
            <p className="text-xs text-stone-300 mt-2" dir="ltr">
              Genie call ID: {ticket.genie_call_id}
            </p>
          )}
        </section>

        {/* פניות קודמות של הלקוח */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-stone-500 mb-2">
            פניות קודמות של הלקוח ({previous?.length ?? 0})
          </h2>
          {previous?.length ? (
            <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              {previous.map((p) => (
                <li key={p.id}>
                  <PreviousTicketRow
                    ticketId={p.id}
                    subject={p.subject}
                    status={p.status}
                    createdAt={p.created_at}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">זו הפנייה הראשונה של הלקוח.</p>
          )}
        </section>

        {/* הערות */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-stone-500 mb-2">הערות</h2>
          <ul className="space-y-2">
            {notes?.map((n) => (
              <li key={n.id} className="bg-amber-50 rounded-xl p-3 text-sm">
                <p className="whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-stone-400 mt-1">
                  {n.author} ·{" "}
                  {new Date(n.created_at).toLocaleString("he-IL", {
                    timeZone: "Asia/Jerusalem",
                  })}
                </p>
              </li>
            ))}
          </ul>
          <form action={addNote.bind(null, ticket.id)} className="mt-3 flex gap-2">
            <input
              name="content"
              placeholder="הוסיפי הערה…"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
              required
            />
            <button className="bg-stone-800 text-white rounded-lg px-4 py-2 text-sm hover:bg-stone-700">
              הוספת הערה
            </button>
          </form>
        </section>

        {/* קבצים */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-stone-500 mb-2">קבצים מצורפים</h2>
          <ul className="space-y-1">
            {attachments?.map((a) => (
              <li key={a.id}>
                <AttachmentLink
                  storagePath={a.storage_path}
                  fileName={a.file_name}
                  sizeBytes={a.size_bytes}
                />
              </li>
            ))}
            {!attachments?.length && (
              <li className="text-sm text-stone-400">אין קבצים מצורפים.</li>
            )}
          </ul>
          <form
            action={uploadAttachment.bind(null, ticket.id)}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="file"
              name="file"
              required
              className="text-sm file:me-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-1.5 file:text-sm hover:file:bg-stone-300"
            />
            <button className="bg-stone-800 text-white rounded-lg px-4 py-2 text-sm hover:bg-stone-700">
              העלאת קובץ
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
