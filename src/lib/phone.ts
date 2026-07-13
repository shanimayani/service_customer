/**
 * נרמול מספרי טלפון ישראליים לפורמט אחיד: 972501234567
 * זה המפתח המקשר של כל המערכת — כל מספר שנכנס (מ-Genie, מקומקס,
 * מהמרכזייה) חייב לעבור דרך הפונקציה הזו לפני שמירה או חיפוש.
 *
 * מטפל ב: 050-1234567, 05 0123 4567, +972-50-1234567, 972501234567,
 * 0722776677 (קווי), 077..., 03-1234567 וכו'.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  // השארת ספרות בלבד
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // הסרת 00 בינלאומי (00972...)
  if (digits.startsWith("00")) digits = digits.slice(2);

  // כבר עם קידומת 972
  if (digits.startsWith("972")) {
    const rest = digits.slice(3).replace(/^0/, ""); // 9720... → 972...
    return isValidLocal(rest) ? `972${rest}` : null;
  }

  // מקומי שמתחיל ב-0 (050..., 03..., 077...)
  if (digits.startsWith("0")) {
    const rest = digits.slice(1);
    return isValidLocal(rest) ? `972${rest}` : null;
  }

  // בלי אפס מוביל (501234567)
  return isValidLocal(digits) ? `972${digits}` : null;
}

/** בדיקת אורך סבירה אחרי הסרת הקידומת: 8–9 ספרות */
function isValidLocal(local: string): boolean {
  return /^\d{8,9}$/.test(local);
}

/** תצוגה נוחה: 972501234567 → 050-123-4567 */
export function displayPhone(normalized: string | null): string {
  if (!normalized?.startsWith("972")) return normalized ?? "";
  const local = "0" + normalized.slice(3);
  if (local.length === 10) {
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  if (local.length === 9) {
    return `${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
  }
  return local;
}
