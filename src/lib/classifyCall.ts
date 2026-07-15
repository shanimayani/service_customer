import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/constants";

const client = new Anthropic();

export type CallClassification = {
  subject: string;
  category: string;
  resolved: boolean;
};

function fallbackSubject(summary: string | null): string {
  if (!summary?.trim()) return "פנייה טלפונית חדשה";
  const firstSentence = summary.split(/[.\n!?]/)[0].trim();
  const base = firstSentence || summary.trim();
  return base.length > 60 ? base.slice(0, 57) + "…" : base;
}

// שיחה שנותקה לפני שנמסרו פרטים — אין שום מידע לפעול לפיו, אז אין טעם
// להשאיר אותה פתוחה לטיפול אנושי. תבנית קבועה שחוזרת בסיכומי Genie.
const DISCONNECTED_BEFORE_DETAILS = "המתקשר ניתק לפני שהספקנו לקבל פרטים.";

/**
 * מסווגת שיחה שהתקבלה מהמזכירה הוירטואלית: מנסחת כותרת קצרה, בוחרת קטגוריה
 * מתוך הרשימה הקבועה, וקובעת אם השיחה טופלה במלואה ואינה דורשת מעקב אנושי.
 * בכל מקרה של ספק, שגיאה או תשובה לא תקינה — חוזרת לברירת מחדל בטוחה
 * (קטגוריה "כללי", לא טופלה) כדי שהפנייה תמיד תישאר לבדיקה ידנית.
 */
export async function classifyCall(
  summary: string | null,
  transcript: string | null
): Promise<CallClassification> {
  const fallback: CallClassification = {
    subject: fallbackSubject(summary),
    category: "כללי",
    resolved: false,
  };

  if (!summary?.trim() && !transcript?.trim()) return fallback;

  if (summary?.trim() === DISCONNECTED_BEFORE_DETAILS) {
    return { subject: "שיחה שנותקה לפני קבלת פרטים", category: "כללי", resolved: true };
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system:
        "את/ה מסייע/ת למוקד שירות לקוחות בעברית. תפקידך לנתח סיכום ותמלול של שיחת טלפון שנענתה על ידי מזכירה וירטואלית (Genie), ולהחזיר כותרת קצרה לפנייה, קטגוריה מתאימה, והאם נדרש טיפול אנושי נוסף. היי שמרן/ית: קבעי resolved=true רק כשברור לגמרי מהתמלול שהשיחה הסתיימה במלואה (למשל שאלה כללית שנענתה) ואין שום בקשה, תלונה או פרט שדורש מעקב של נציג אנושי.",
      messages: [
        {
          role: "user",
          content: `סיכום השיחה:\n${summary ?? "אין סיכום"}\n\nתמלול השיחה:\n${transcript ?? "אין תמלול"}`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              subject: {
                type: "string",
                description: "כותרת קצרה וברורה לפנייה, עד 60 תווים, בעברית.",
              },
              category: {
                type: "string",
                enum: CATEGORIES,
              },
              resolved: {
                type: "boolean",
                description:
                  "true רק אם ברור לגמרי שהשיחה טופלה במלואה ואין צורך במעקב אנושי נוסף.",
              },
            },
            required: ["subject", "category", "resolved"],
            additionalProperties: false,
          },
        },
      },
    });

    if (response.stop_reason === "refusal") return fallback;

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return fallback;

    const parsed = JSON.parse(textBlock.text) as Partial<CallClassification>;
    if (
      typeof parsed.subject !== "string" ||
      !parsed.subject.trim() ||
      typeof parsed.category !== "string" ||
      typeof parsed.resolved !== "boolean"
    ) {
      return fallback;
    }

    const category = CATEGORIES.includes(parsed.category) ? parsed.category : "כללי";
    const subject =
      parsed.subject.length > 60 ? parsed.subject.slice(0, 57) + "…" : parsed.subject;

    return { subject, category, resolved: parsed.resolved };
  } catch (err) {
    console.error("classifyCall failed, using fallback", err);
    return fallback;
  }
}
