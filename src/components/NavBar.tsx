'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

function ScalesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 7h18" /><path d="M3 7l3 6H0l3-6z" /><path d="M21 7l3 6h-6l3-6z" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="10" width="20" height="11" />
      <path d="M2 10l10-7 10 7" />
      <line x1="8" y1="21" x2="8" y2="15" /><line x1="16" y1="21" x2="16" y2="15" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Judges', Icon: ScalesIcon },
  { href: '/judges/federal', label: 'Federal', Icon: BuildingIcon },
  { href: '/counties', label: 'Counties', Icon: GridIcon },
  { href: '/states', label: 'States', Icon: MapIcon },
  { href: '/methodology', label: 'Methodology', Icon: DocIcon },
  { href: '/contribute', label: 'Contribute', Icon: GiftIcon, badge: 'NEW' as const },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 no-underline mr-4 shrink-0">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] shrink-0" />
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Red<span className="text-[var(--red-primary)]">Handed</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
          {NAV_LINKS.map(({ href, label, Icon, badge }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 whitespace-nowrap shrink-0 no-underline
                  ${isActive
                    ? 'font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)]'
                    : 'font-medium text-[var(--text-secondary)] border border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
              >
                <Icon />
                {label}
                {badge && (
                  <span
                    style={{
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      padding: '0.1rem 0.35rem',
                      background: 'rgba(220,38,38,0.15)',
                      border: '1px solid rgba(220,38,38,0.35)',
                      borderRadius: '0.25rem',
                      color: 'var(--red-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto p-2 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2">
          {NAV_LINKS.map(({ href, label, Icon, badge }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm transition-colors no-underline
                  ${isActive
                    ? 'font-semibold text-[var(--text-primary)] bg-[var(--bg-card)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                <Icon />
                {label}
                {badge && (
                  <span
                    style={{
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      padding: '0.1rem 0.35rem',
                      background: 'rgba(220,38,38,0.15)',
                      border: '1px solid rgba(220,38,38,0.35)',
                      borderRadius: '0.25rem',
                      color: 'var(--red-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
