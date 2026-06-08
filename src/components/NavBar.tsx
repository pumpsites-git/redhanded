'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'State Judges', icon: '⚖️' },
  { href: '/judges/federal', label: 'Federal Judges', icon: '🏛️' },
  { href: '/districts', label: 'Districts', icon: '🗺️' },
  { href: '/states', label: 'States', icon: '🇺🇸' },
  { href: '/rankings', label: 'Rankings', icon: '📊' },
  { href: '/offenders', label: 'Offenders', icon: '🔍' },
  { href: '/insights', label: 'Insights', icon: '💡' },
  { href: '/methodology', label: 'Methodology', icon: '📐' },
  { href: '/state-deep-dives', label: 'Deep Dives', icon: '🔬' },
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
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🔴</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
          {NAV_LINKS.map(({ href, label, icon }) => {
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
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>

        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Public Court Data
        </span>
      </div>
    </nav>
  );
}
