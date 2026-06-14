import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: {
    default: "RedHanded — Judicial Accountability",
    template: "%s | RedHanded",
  },
  description:
    "Track, score, and hold judges accountable with real public court data. 236+ judges ranked by their actual sentencing decisions across Illinois and Florida.",
  keywords: [
    "judicial accountability",
    "judge sentencing records",
    "court transparency",
    "Cook County judges",
    "Florida sentencing data",
    "leniency score",
    "criminal justice data",
    "judge rankings",
  ],
  openGraph: {
    title: "RedHanded — Judicial Accountability",
    description:
      "236+ judges ranked by their actual sentencing decisions. Real court data. No spin.",
    type: "website",
    siteName: "RedHanded",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedHanded — Judicial Accountability",
    description:
      "236+ judges ranked by their actual sentencing decisions. Real court data. No spin.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar />
        <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
