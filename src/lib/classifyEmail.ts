import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/constants";

const client = new Anthropic();

export type EmailClassification = { category: string };

/**
 * מסווגת מייל שהתקבל לפנייה חדשה: בוחרת קטגוריה מתוך הרשימה הקבועה על סמך
 * נושא וגוף המייל. בכל מקרה של ספק, שגיאה או תשובה לא תקינה — חוזרת
 * לקטגוריה "כללי" כדי שהפנייה תמיד תישאר לבדיקה ידנית.
 */
export async function classifyEmail(subject: string, body: string): Promise<EmailClassification> {
  const fallback: EmailClassification = { category: "כללי" };
  if (!subject.trim() && !body.trim()) return fallback;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      thinking: { type: "adaptive" },
      system:
        "את/ה מסייע/ת למוקד שירות לקוחות בעברית. תפקידך לנתח נושא וגוף של מייל שהתקבל מלקוח, ולהחזיר את הקטגוריה המתאימה ביותר לפנייה מתוך רשימה קבועה.",
      messages: [
        { role: "user", content: `נושא:\n${subject || "(אין נושא)"}\n\nגוף ההודעה:\n${body || "(ריק)"}` },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { category: { type: "string", enum: CATEGORIES } },
            required: ["category"],
            additionalProperties: false,
          },
        },
      },
    });

    if (response.stop_reason === "refusal") return fallback;
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return fallback;

    const parsed = JSON.parse(textBlock.text) as Partial<EmailClassification>;
    if (typeof parsed.category !== "string") return fallback;
    return { category: CATEGORIES.includes(parsed.category) ? parsed.category : "כללי" };
  } catch (err) {
    console.error("classifyEmail failed, using fallback", err);
    return fallback;
  }
}
