import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizePolicyHtml } from "@/lib/sanitizeHtml";
import PolicyEditor from "@/components/PolicyEditor";

export const dynamic = "force-dynamic";

export default async function PolicyPage() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("policy_document")
    .select("content, updated_at, updated_by")
    .eq("id", 1)
    .maybeSingle();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-sm text-stone-500 hover:underline">
        → חזרה לדשבורד
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">מדיניות שירות לקוחות</h1>
      <PolicyEditor
        initialContent={data?.content ? sanitizePolicyHtml(data.content) : ""}
        updatedAt={data?.updated_at ?? null}
        updatedBy={data?.updated_by ?? null}
      />
    </main>
  );
}
