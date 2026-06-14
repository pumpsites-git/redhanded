import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Federal Judges — Accountability Scores',
  description:
    '9,396 federal judges tracked with accountability scores. Browse district, appellate, and other federal courts by state, party, and experience.',
  openGraph: {
    title: 'Federal Judges — RedHanded',
    description: 'Browse 9,396 federal judges with accountability scores from CourtListener.',
  },
};

export default function FederalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
