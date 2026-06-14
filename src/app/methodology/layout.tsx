import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology & Data Sources',
  description:
    'Full transparency on how RedHanded collects, processes, and presents judicial accountability data. Leniency Score calculation, data sources, and pipeline details.',
  openGraph: {
    title: 'Methodology — RedHanded',
    description: 'How we calculate leniency scores and where the data comes from.',
  },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
