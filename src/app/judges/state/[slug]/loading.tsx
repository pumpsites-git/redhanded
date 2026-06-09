export default function Loading() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Breadcrumb skeleton */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div className="skeleton" style={{ height: '16px', width: '200px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Header skeleton */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: '28px', width: '280px', borderRadius: '4px', marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ height: '16px', width: '220px', borderRadius: '4px', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: '64px', width: '100px', borderRadius: '0.5rem' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content grid skeleton */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton" style={{ height: '250px', borderRadius: '0.75rem' }} />
        ))}
      </div>
    </div>
  );
}
