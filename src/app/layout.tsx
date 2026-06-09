import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";
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
    "Track, score, and hold judges accountable with real public court data. 146+ judges ranked by their actual sentencing decisions across Illinois and Florida.",
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
      "146+ judges ranked by their actual sentencing decisions. Real court data. No spin.",
    type: "website",
    siteName: "RedHanded",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedHanded — Judicial Accountability",
    description:
      "146+ judges ranked by their actual sentencing decisions. Real court data. No spin.",
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
        <div style={{ minHeight: "calc(100vh - 3.5rem)" }}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        padding: "2.5rem 1rem 3rem",
        marginTop: "3rem",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#dc2626",
                boxShadow: "0 0 8px rgba(220,38,38,0.4)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Red<span style={{ color: "var(--red-primary)" }}>Handed</span>
            </span>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: "220px",
            }}
          >
            Judicial accountability through transparency. Because the public
            deserves to know who's deciding the fate of criminals in their
            community.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.75rem",
            }}
          >
            Explore
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { href: "/", label: "State Judges" },
              { href: "/judges/federal", label: "Federal Judges" },
              { href: "/state-deep-dive/fl", label: "Florida Deep Dive" },
              { href: "/methodology", label: "Methodology" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <h3
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.75rem",
            }}
          >
            Data Sources
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            <p>Cook County State's Attorney Open Data Portal</p>
            <p>FDLE Criminal Justice Data Transparency Portal</p>
            <p>CourtListener (Federal Judges)</p>
            <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
              All data sourced from public court records.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div>
          <h3
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.75rem",
            }}
          >
            Disclaimer
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            This site presents publicly available government data. Scores and
            rankings reflect statistical patterns in sentencing records and do
            not constitute legal advice or personal character judgments.
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: "72rem",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        © {new Date().getFullYear()} RedHanded · All data from public court
        records · Built for judicial transparency
      </div>
    </footer>
  );
}
