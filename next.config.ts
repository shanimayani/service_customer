import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // עד 5 קבצים בפעם אחת, עד 20MB לקובץ (ר' MAX_ATTACHMENTS_PER_TICKET / MAX_FILE_SIZE ב-src/lib/attachments.ts)
      bodySizeLimit: "105mb",
    },
  },
};

export default nextConfig;
