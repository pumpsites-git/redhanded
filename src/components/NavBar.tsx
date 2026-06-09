'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// SVG icons — no emoji, guaranteed to render everywhere
function ScalesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 7h18" />
      <path d="M3 7l3 6H0l3-6z" />
      <path d="M21 7l3 6h-6l3-6z" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="10" width="20" height="11" />
      <path d="M2 10l10-7 10 7" />
      <line x1="8" y1="21" x2="8" y2="15" />
      <line x1="16" y1="21" x2="16" y2="15" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'State Judges', Icon: ScalesIcon },
  { href: '/judges/federal', label: 'Federal Judges', Icon: BuildingIcon },
  { href: '/state-deep-dive/fl', label: 'Florida Deep Dive', Icon: SunIcon },
  { href: '/methodology', label: 'Methodology', Icon: DocIcon },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          height: '3.5rem',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            marginRight: '1.5rem',
            flexShrink: 0,
          }}
        >
          {/* Red dot — pure CSS, no emoji */}
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#dc2626',
              boxShadow: '0 0 8px rgba(220,38,38,0.5)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Red<span style={{ color: 'var(--red-primary)' }}>Handed</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, overflowX: 'auto' }}>
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Icon />
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}
        </div>

        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, display: 'none' }} className="nav-tagline">
          Public Court Data
        </span>
      </div>
    </nav>
  );
}
