'use client';

import { useState } from 'react';

const TEMPLATE = `Subject: Public Records Request — Criminal Case Sentencing Data with Judge Assignments

Dear [County] County Clerk of Courts,

Pursuant to [State]'s public records law ([CITATION]), I am requesting access to the following public records:

**Records Requested:**

All criminal case records (felony and misdemeanor) disposed of between January 1, 2024, and the present date, including the following fields for each case:

1. Case number
2. Defendant name (or anonymized identifier)
3. Presiding/assigned judge name
4. Charge(s) and statute(s)
5. Disposition (e.g., adjudicated guilty, adjudication withheld, nolle prosequi, dismissed)
6. Sentence imposed (e.g., prison, jail, probation, community service, fines)
7. Sentence length (if applicable)
8. Date of disposition
9. Court division (if applicable)

**Preferred Format:**

If available, I would greatly appreciate receiving this data in an electronic format such as CSV, Excel, or database export. This would minimize duplication costs for both parties.

**Purpose:**

This data is being compiled for a public transparency project analyzing judicial sentencing patterns using publicly available court records. The project presents aggregate statistical data and does not publish personal information about individual defendants.

**Cost:**

I understand that reasonable charges for duplication may apply. If the estimated cost exceeds $50, please provide an estimate before proceeding so I can narrow the scope if necessary.

**Response Timeline:**

I respectfully request that this be fulfilled promptly in accordance with your state's public records law. If you anticipate a delay, please acknowledge receipt of this request and provide an estimated timeline.

Thank you for your assistance in fulfilling this public records request.

Sincerely,
[Your Name]
[Email]
[Phone — optional]`;

export default function RequestTemplate() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
      const el = document.getElementById('email-template-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>📧</span>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Email Template — Public Records Request
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.4rem',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.4rem',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(220,38,38,0.35)'}`,
              background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.1)',
              color: copied ? '#22c55e' : 'var(--red-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Template
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template body */}
      <div
        style={{
          maxHeight: expanded ? 'none' : '220px',
          overflow: expanded ? 'visible' : 'hidden',
          position: 'relative',
        }}
      >
        <pre
          id="email-template-text"
          style={{
            margin: 0,
            padding: '1.25rem',
            fontSize: '0.78rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {TEMPLATE}
        </pre>
        {!expanded && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(to bottom, transparent, var(--bg-card))',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '0.75rem',
            }}
          >
            <button
              onClick={() => setExpanded(true)}
              style={{
                padding: '0.3rem 0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Show full template ▼
            </button>
          </div>
        )}
      </div>

      {/* Customize tip */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border)',
          background: 'rgba(220,38,38,0.04)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>✏️</span>
        <span>
          Replace <strong style={{ color: 'var(--text-secondary)' }}>[County]</strong>,{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>[State]</strong>, and{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>[CITATION]</strong> with your jurisdiction's
          details. See state-specific citations below.
        </span>
      </div>
    </div>
  );
}
