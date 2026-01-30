import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semantic Flow - Elite English Writing Trainer",
  description: "Master C1-level English through AI-powered sentence reconstruction training. Write with native precision.",
  keywords: "English learning, IELTS, writing trainer, AI, language learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
