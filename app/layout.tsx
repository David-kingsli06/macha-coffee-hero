import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matcha Coffee — Artisan Japanese Matcha Experience",
  description: "Pure ceremonial grade Uji matcha meets specialty cold brew. A harmonious blend crafted for sustained clarity and mindful rituals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#080d09] text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      <body className="min-h-full flex flex-col font-sans bg-[#080d09] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
