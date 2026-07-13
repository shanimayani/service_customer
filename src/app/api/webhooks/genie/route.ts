import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

/**
 * POST /api/webhooks/genie
 *
 * מותאם למבנה ה-payload של Genie:
 * {
 *   "event": "call.completed",
 *   "callId": "clxyz123...",
 *   "businessId": "clxyz456...",
 *   "callerNumber": "+972501234567",
 *   "durationSeconds": 45,
 *   "summary": "...",
 *   "transcript": "...",
 *   "isTestCall": false,
 *   "startedAt": "2025-01-15T10:30:00.000Z",
 *   "completedAt": "2025-01-15T10:30:45.000Z"
 * }
 */

type GeniePayload = {
  event: string;
  callId: string;
  businessId: string;
  callerNumber: string;
  durationSeconds: number;
  summary: string | null;
  transcript: string | null;
  isTestCall: boolean;
  startedAt: string;
  completedAt: string;
};

export async function POST(req: NextRequest) {
  // --- אימות ---
  const secret = process.env.GENIE_WEBHOOK_SECRET;
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("x-webhook-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: GeniePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // מעבדים רק שיחות שהסתיימו; אירועים אחרים מאושרים בלי פעולה
  // (חשוב להחזיר 200 כדי ש-Genie לא תנסה שוב ושוב)
  if (body.event !== "call.completed") {
    return NextResponse.json({ ok: true, skipped: body.event });
  }

  // שיחות בדיקה לא נכנסות למערכת. אם תרצי לראות אותן — החליפי
  // את ה-return בהוספת source: 'genie_test' לטיקט.
  if (body.isTestCall) {
    return NextResponse.json({ ok: true, skipped: "test call" });
  }

  const phone = normalizePhone(body.callerNumber);
  if (!phone) {
    console.error("unparseable callerNumber:", body.callerNumber);
    return NextResponse.json({ error: "unparseable phone" }, { status: 422 });
  }

  const db = supabaseAdmin();

  // --- upsert לקוח לפי טלפון ---
  // אין שם מתקשר ב-payload, אז לקוח חדש נוצר ללא שם.
  // upsert בלי לדרוס: אם הלקוח קיים, לא נוגעים בשם שהוזן ידנית.
  const { data: customer, error: custErr } = await db
    .from("customers")
    .upsert({ phone }, { onConflict: "phone", ignoreDuplicates: false })
    .select("id")
    .single();

  if (custErr || !customer) {
    console.error("customer upsert failed", custErr);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  // --- יצירת פנייה, idempotent לפי callId ---
  const { data: ticket, error: tickErr } = await db
    .from("tickets")
    .upsert(
      {
        customer_id: customer.id,
        subject: subjectFromSummary(body.summary),
        category: "כללי", // כאן ייכנס בהמשך סיווג AI
        source: "genie",
        call_summary: body.summary,
        call_transcript: body.transcript,
        call_duration_seconds: body.durationSeconds,
        genie_call_id: body.callId,
        created_at: body.startedAt, // זמן השיחה, לא זמן קליטת ה-webhook
      },
      { onConflict: "genie_call_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();

  if (tickErr) {
    console.error("ticket insert failed", tickErr);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticketId: ticket?.id ?? null });
}

/**
 * גזירת נושא קריא מהסיכום: המשפט הראשון, עד 60 תווים.
 * "הלקוח ביקש הצעת מחיר לשירות X" → נושא מצוין כמו שהוא.
 */
function subjectFromSummary(summary: string | null): string {
  if (!summary?.trim()) return "פנייה טלפונית חדשה";
  const firstSentence = summary.split(/[.\n!?]/)[0].trim();
  const base = firstSentence || summary.trim();
  return base.length > 60 ? base.slice(0, 57) + "…" : base;
}
