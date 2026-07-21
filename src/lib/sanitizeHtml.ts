import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "ul", "ol", "li", "span", "mark"];
const ALLOWED_ATTR = ["style"];

/** מסננת HTML שנשמר מעורך המדיניות, מותירה רק תגיות עיצוב טקסט בסיסיות (נגד XSS). */
export function sanitizePolicyHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
