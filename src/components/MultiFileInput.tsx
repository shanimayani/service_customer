"use client";

import { useState } from "react";

export default function MultiFileInput({
  id,
  name,
  max,
}: {
  id: string;
  name: string;
  max: number;
}) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <input
        id={id}
        name={name}
        type="file"
        multiple
        onChange={(e) => setCount(e.target.files?.length ?? 0)}
        className="w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-1.5 file:text-sm hover:file:bg-stone-300"
      />
      {count > max && (
        <p className="text-amber-600 text-xs mt-1">
          נבחרו {count} קבצים, אך ניתן לצרף עד {max} — רק {max} הראשונים יועלו.
        </p>
      )}
    </div>
  );
}
