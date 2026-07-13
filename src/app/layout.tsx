import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "מוקד פניות",
  description: "מערכת ניהול פניות שירות לקוחות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} bg-stone-100 text-stone-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
