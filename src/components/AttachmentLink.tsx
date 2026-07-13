"use client";

import { getDownloadUrl } from "@/app/dashboard/[id]/actions";

export default function AttachmentLink({
  storagePath,
  fileName,
  sizeBytes,
}: {
  storagePath: string;
  fileName: string;
  sizeBytes: number | null;
}) {
  async function open() {
    const url = await getDownloadUrl(storagePath);
    if (url) window.open(url, "_blank");
  }

  const size =
    sizeBytes != null ? ` (${(sizeBytes / 1024).toFixed(0)}KB)` : "";

  return (
    <button
      onClick={open}
      className="text-sm text-sky-700 hover:underline"
      type="button"
    >
      📎 {fileName}
      <span className="text-stone-400">{size}</span>
    </button>
  );
}
