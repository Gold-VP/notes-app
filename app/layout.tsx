import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Заметки",
  description: "AI-заметки с glassmorphism",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
