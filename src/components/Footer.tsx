import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-3 h-3 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.5)]" />
              <span className="font-bold text-[var(--text-primary)]">RedHanded</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Judicial accountability through public court data. Not affiliated with any government agency.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Judges</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-underline">State Judges</Link></li>
              <li><Link href="/judges/federal" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-underline">Federal Judges</Link></li>
              <li><Link href="/state-deep-dive/fl" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-underline">Florida Deep Dive</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">About</h4>
            <ul className="space-y-2">
              <li><Link href="/methodology" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-underline">Methodology</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-[var(--text-muted)]">
            Data sourced from public court records, FDLE, and CourtListener.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} RedHanded
          </p>
        </div>
      </div>
    </footer>
  );
}
