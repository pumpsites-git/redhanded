import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute — Help Us Hold Judges Accountable | RedHanded',
  description:
    'Earn bounties by requesting criminal case data from your county clerk of courts. Help RedHanded build the most comprehensive judicial accountability database in America.',
  openGraph: {
    title: 'Contribute to RedHanded — Bounty Program',
    description:
      'Request public records from your county clerk and earn bounties. We need criminal case disposition data from every county in America.',
  },
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
