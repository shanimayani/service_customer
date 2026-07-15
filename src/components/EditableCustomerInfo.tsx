"use client";

import { useState, useTransition } from "react";
import { displayPhone } from "@/lib/phone";
import { updateCustomer } from "@/app/dashboard/[id]/actions";

export default function EditableCustomerInfo({
  ticketId,
  customerId,
  name,
  email,
  phone,
}: {
  ticketId: string;
  customerId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name ?? "");
  const [emailValue, setEmailValue] = useState(email ?? "");
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <p className="text-sm text-stone-500 mt-2 flex items-center gap-2 flex-wrap">
        <span>
          {name ?? "לקוח ללא שם"}
          {email && ` · ${email}`} · <span dir="ltr">{displayPhone(phone ?? "")}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setNameValue(name ?? "");
            setEmailValue(email ?? "");
            setEditing(true);
          }}
          className="text-stone-400 hover:text-stone-700"
          title="עדכון שם ואימייל"
        >
          ✏️
        </button>
      </p>
    );
  }

  function save() {
    startTransition(async () => {
      await updateCustomer(ticketId, customerId, { name: nameValue, email: emailValue });
      setEditing(false);
    });
  }

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <input
        autoFocus
        placeholder="שם הלקוח"
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        disabled={isPending}
        className="text-sm rounded-lg border border-stone-300 px-2 py-1 w-40"
      />
      <input
        type="email"
        placeholder="אימייל"
        value={emailValue}
        onChange={(e) => setEmailValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        disabled={isPending}
        dir="ltr"
        className="text-sm rounded-lg border border-stone-300 px-2 py-1 w-52"
      />
      <span className="text-sm text-stone-400" dir="ltr">
        {displayPhone(phone ?? "")}
      </span>
      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="text-sm bg-stone-800 text-white rounded-lg px-3 py-1.5 hover:bg-stone-700"
      >
        שמירה
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={isPending}
        className="text-sm text-stone-500 hover:underline"
      >
        ביטול
      </button>
    </div>
  );
}
