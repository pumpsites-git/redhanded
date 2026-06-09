export default function Loading() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header skeleton */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div className="skeleton" style={{ height: '14px', width: '140px', borderRadius: '4px', marginBottom: '0.75rem' }} />
          <div className="skeleton" style={{ height: '32px', width: '360px', borderRadius: '4px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '16px', width: '260px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Content skeleton */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ height: '24px', width: '200px', borderRadius: '4px', marginBottom: '1rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="skeleton" style={{ height: '90px', borderRadius: '0.75rem' }} />
              ))}
            </div>
            <div className="skeleton" style={{ height: '120px', borderRadius: '0.75rem' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
