import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedHanded — Judicial Accountability",
  description: "Track, score, and hold judges accountable with public court data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
