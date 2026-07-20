"use client";

import { useState } from "react";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";

export default function CategoriesFormField({
  name,
  categories,
  defaultSelected = [],
}: {
  name: string;
  categories: string[];
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  return (
    <>
      {selected.map((c) => (
        <input key={c} type="hidden" name={name} value={c} />
      ))}
      <CategoryMultiSelect
        categories={categories}
        selected={selected}
        onChange={setSelected}
        emptyLabel="ללא הגבלה (גישה מלאה)"
      />
    </>
  );
}
