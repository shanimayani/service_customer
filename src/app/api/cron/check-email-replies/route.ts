import { NextRequest, NextResponse } from "next/server";
import { pollEmailReplies } from "@/lib/imapPoll";

/**
 * מופעל ע"י Vercel Cron (ראו vercel.json). וורסל שולחת אוטומטית
 * Authorization: Bearer <CRON_SECRET> בבקשות cron כשמוגדר CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await pollEmailReplies();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("email reply poll failed", err);
    return NextResponse.json({ error: "poll failed" }, { status: 500 });
  }
}
