import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserCategories } from "@/lib/auth";
import { STATUSES, CATEGORIES, categoryColor, type Status } from "@/lib/constants";
import { addNote, updateStatus, uploadAttachment, sendTicketEmail } from "./actions";
import { MAX_ATTACHMENTS_PER_TICKET } from "@/lib/attachments";
import AttachmentLink from "@/components/AttachmentLink";
import MultiFileInput from "@/components/MultiFileInput";
import EditableSubject from "@/components/EditableSubject";
import EditableCustomerInfo from "@/components/EditableCustomerInfo";
import PreviousTicketRow from "@/components/PreviousTicketRow";
import AdditionalCallRow from "@/components/AdditionalCallRow";
import CategoryButtons from "@/components/CategoryButtons";
import BackToListLink from "@/components/BackToListLink";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const db = supabaseAdmin();
  const userCategories = await getUserCategories();

  const { data: ticket } = await db
    .from("tickets")
    .select("*, customers(id, name, phone, email)")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();
  if (userCategories && !userCategories.includes(ticket.category)) notFound();
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
  if (userCategories) previousQuery = previousQuery.in("category", userCategories);

  const [{ data: notes }, { data: attachments }, { data: previous }, { data: additionalCalls }] =
    await Promise.all([
      db.from("notes").select("*").eq("ticket_id", id).order("created_at"),
      db.from("attachments").select("*").eq("ticket_id", id).order("created_at"),
      // קישור פניות קודמות: כל הפניות של אותו לקוח (מוגבל לקטגוריה של המשתמש, אם יש)
      previousQuery,
      // שיחות נוספות שהתקבלו בזמן שהפנייה הזו הייתה פתוחה
      db
        .from("ticket_calls")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at"),
    ]);

  const st = STATUSES[ticket.status as Status];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <BackToListLink />

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-3 mt-3 text-sm">{error}</p>
      )}

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

        <EditableCustomerInfo
          ticketId={ticket.id}
          customerId={customer.id}
          name={customer?.name ?? null}
          email={customer?.email ?? null}
          phone={customer?.phone ?? null}
        />
        <p className="text-xs text-stone-400 mt-1">
          נפתחה{" "}
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
        <CategoryButtons ticketId={ticket.id} currentCategory={ticket.category} />

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
            {ticket.source === "email" && (
              <span className="text-xs text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full ring-1 ring-sky-200">
                נוצר אוטומטית ממייל
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

        {/* שיחות נוספות שהתקבלו בזמן שהפנייה הזו הייתה פתוחה */}
        {additionalCalls?.length ? (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-stone-500 mb-2">
              פניות נוספות בפנייה זו ({additionalCalls.length})
            </h2>
            <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              {additionalCalls.map((c) => (
                <li key={c.id}>
                  <AdditionalCallRow
                    callSummary={c.call_summary}
                    callTranscript={c.call_transcript}
                    callRecordingUrl={c.call_recording_url}
                    callDurationSeconds={c.call_duration_seconds}
                    source={c.source}
                    createdAt={c.created_at}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
          {(attachments?.length ?? 0) < MAX_ATTACHMENTS_PER_TICKET ? (
            <form
              action={uploadAttachment.bind(null, ticket.id)}
              className="mt-3 flex items-center gap-2"
            >
              <MultiFileInput
                id="files"
                name="files"
                max={MAX_ATTACHMENTS_PER_TICKET - (attachments?.length ?? 0)}
              />
              <button className="bg-stone-800 text-white rounded-lg px-4 py-2 text-sm hover:bg-stone-700 whitespace-nowrap">
                העלאת קבצים
              </button>
            </form>
          ) : (
            <p className="text-xs text-stone-400 mt-3">
              הגעת למכסה של {MAX_ATTACHMENTS_PER_TICKET} קבצים מצורפים לפנייה.
            </p>
          )}
        </section>

        {/* שליחת מייל ללקוח */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-stone-500 mb-2">שליחת מייל ללקוח</h2>
          <form action={sendTicketEmail.bind(null, ticket.id)} className="space-y-3">
            <div>
              <label htmlFor="to" className="block text-xs text-stone-500 mb-1">
                אל
              </label>
              <input
                id="to"
                name="to"
                type="email"
                dir="ltr"
                required
                defaultValue={customer?.email ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-xs text-stone-500 mb-1">
                נושא
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                defaultValue={ticket.subject}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label htmlFor="body" className="block text-xs text-stone-500 mb-1">
                תוכן ההודעה
              </label>
              <textarea
                id="body"
                name="body"
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            {attachments?.length ? (
              <div>
                <span className="block text-xs text-stone-500 mb-1">קבצים לצירוף</span>
                <div className="space-y-1">
                  {attachments.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="attachmentIds" value={a.id} className="accent-stone-800" />
                      {a.file_name}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <button className="bg-stone-800 text-white rounded-lg px-4 py-2 text-sm hover:bg-stone-700">
              שליחת מייל
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
