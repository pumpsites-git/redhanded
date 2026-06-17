'use client';

import { useState } from 'react';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

const ACCEPTED_FORMATS = [
  { ext: '.csv', label: 'CSV', color: '#22c55e' },
  { ext: '.xlsx', label: 'Excel', color: '#0ea5e9' },
  { ext: '.xls', label: 'Excel (legacy)', color: '#0ea5e9' },
  { ext: '.pdf', label: 'PDF', color: '#f59e0b' },
];

const REQUIRED_FIELDS = [
  { field: 'Case Number', required: true, example: 'CF-2024-001234' },
  { field: 'Judge Name', required: true, example: 'Hon. Jane Smith' },
  { field: 'Charge(s)', required: true, example: 'Battery, Possession of Controlled Substance' },
  { field: 'Disposition', required: true, example: 'Adjudicated Guilty / Dismissed / Nolle Prosequi' },
  { field: 'Sentence Imposed', required: true, example: '18 months probation, $500 fine' },
  { field: 'Date of Disposition', required: true, example: '2024-03-15' },
  { field: 'Defendant Name', required: false, example: 'Optional — can be anonymized' },
  { field: 'Sentence Length (days)', required: false, example: '365' },
  { field: 'Court Division', required: false, example: 'Criminal Division A' },
];

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContributeUpload() {
  const [state, setState] = useState<string>('');
  const [county, setCounty] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [formState, setFormState] = useState<FormState>('idle');
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !county || !email || !file) return;

    setFormState('submitting');

    // Build mailto link as placeholder (Supabase storage wired up later)
    const subject = encodeURIComponent(`RedHanded Data Submission — ${county} County, ${state}`);
    const body = encodeURIComponent(
      `State: ${state}\nCounty: ${county}\nFile: ${file.name}\nNotes: ${notes || 'None'}`
    );
    const mailto = `mailto:data@redhanded.us?subject=${subject}&body=${body}`;

    // Simulate brief loading then open mailto
    await new Promise((r) => setTimeout(r, 600));
    window.location.href = mailto;
    setFormState('success');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.375rem',
    letterSpacing: '0.02em',
  };

  return (
    <div id="upload" style={{ scrollMarginTop: '5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left: Upload form */}
        <div>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 1.25rem 0',
            }}
          >
            Submit Your Data
          </h3>

          {formState === 'success' ? (
            <div
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '0.875rem',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <h4 style={{ color: '#22c55e', fontWeight: 700, marginBottom: '0.5rem' }}>
                Thank You!
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Your email client should have opened with the submission details. After sending,
                we'll review your data and process your bounty within 5–10 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* State */}
              <div>
                <label style={labelStyle}>State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select a state…</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* County */}
              <div>
                <label style={labelStyle}>County *</label>
                <input
                  type="text"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="e.g. Miami-Dade, Cook, Los Angeles…"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Your Email (for bounty payment) *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              {/* File upload */}
              <div>
                <label style={labelStyle}>Data File (CSV, Excel, or PDF) *</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--red-primary)' : file ? 'rgba(34,197,94,0.5)' : 'var(--border)'}`,
                    borderRadius: '0.625rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver
                      ? 'rgba(220,38,38,0.04)'
                      : file
                      ? 'rgba(34,197,94,0.04)'
                      : 'var(--bg-primary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {file ? (
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>📎</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22c55e' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>☁️</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Drag &amp; drop or <span style={{ color: 'var(--red-primary)', fontWeight: 600 }}>click to browse</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                        CSV, Excel, or PDF • Max 50 MB
                      </div>
                    </div>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Time period covered, how you obtained the data, any caveats…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <button
                type="submit"
                disabled={formState === 'submitting' || !state || !county || !email || !file}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--red-primary)',
                  border: 'none',
                  borderRadius: '0.625rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: formState === 'submitting' ? 'wait' : 'pointer',
                  opacity: (!state || !county || !email || !file) ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {formState === 'submitting' ? (
                  <>⏳ Preparing submission…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Submit Data &amp; Claim Bounty
                  </>
                )}
              </button>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0', textAlign: 'center' }}>
                By submitting, you confirm this data was obtained legally via public records law.
              </p>
            </form>
          )}
        </div>

        {/* Right: Data format guide */}
        <div>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 1.25rem 0',
            }}
          >
            Accepted Formats &amp; Required Fields
          </h3>

          {/* Format badges */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {ACCEPTED_FORMATS.map((fmt) => (
              <span
                key={fmt.ext}
                style={{
                  padding: '0.25rem 0.625rem',
                  background: `${fmt.color}12`,
                  border: `1px solid ${fmt.color}30`,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: fmt.color,
                }}
              >
                {fmt.label}
              </span>
            ))}
          </div>

          {/* Fields table */}
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                padding: '0.5rem 0.875rem',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Example</span>
            </div>
            {REQUIRED_FIELDS.map((f, i) => (
              <div
                key={f.field}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  padding: '0.5rem 0.875rem',
                  borderBottom: i < REQUIRED_FIELDS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'start',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.25rem',
                      background: f.required ? 'rgba(220,38,38,0.1)' : 'rgba(163,163,163,0.08)',
                      border: `1px solid ${f.required ? 'rgba(220,38,38,0.25)' : 'rgba(163,163,163,0.2)'}`,
                      color: f.required ? 'var(--red-primary)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {f.required ? 'REQ' : 'OPT'}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {f.field}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {f.example}
                </span>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.875rem 1rem',
              background: 'rgba(99,102,241,0.07)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '0.625rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#6366f1' }}>💡 Pro tip:</strong> If the clerk provides data
            in a format you can't convert (e.g., proprietary database export), submit it as-is
            with a note. We can process most formats.
          </div>
        </div>
      </div>
    </div>
  );
}
