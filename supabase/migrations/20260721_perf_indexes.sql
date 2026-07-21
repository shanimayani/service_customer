-- מריצים ידנית ב-Supabase SQL editor (אין כאן חיבור ישיר ל-DB מהריפו).
-- אינדקסים לתמיכה בסינון/מיון/ספירה בדשבורד ובעמוד הפנייה, ובחיפוש חופשי (ilike).

-- דשבורד: סינון לפי קטגוריה+סטטוס, מיון לפי תאריך יצירה
create index if not exists tickets_category_status_idx on tickets (category, status);
create index if not exists tickets_created_at_idx on tickets (created_at desc);

-- עמוד פנייה בודדת: "פניות קודמות של הלקוח", וקישורי FK שלא מקבלים אינדקס אוטומטי ב-Postgres
create index if not exists tickets_customer_id_idx on tickets (customer_id);
create index if not exists attachments_ticket_id_idx on attachments (ticket_id);
create index if not exists notes_ticket_id_idx on notes (ticket_id);
create index if not exists ticket_calls_ticket_id_idx on ticket_calls (ticket_id);

-- חיפוש חופשי (ilike '%...%') בנושא/סיכום שיחה ובטלפון לקוח — אינדקס btree רגיל לא עוזר
-- ל-ilike עם % מוביל, לכן טריגרם (pg_trgm) כדי שהחיפוש לא יעשה סריקת טבלה מלאה.
create extension if not exists pg_trgm;
create index if not exists tickets_subject_trgm_idx on tickets using gin (subject gin_trgm_ops);
create index if not exists tickets_call_summary_trgm_idx on tickets using gin (call_summary gin_trgm_ops);
create index if not exists customers_phone_trgm_idx on customers using gin (phone gin_trgm_ops);
