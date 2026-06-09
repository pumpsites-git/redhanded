export default function Loading() {
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Hero skeleton */}
      <div
        className="skeleton"
        style={{ height: '180px', marginBottom: '1.5rem', borderRadius: '0.75rem' }}
      />
      {/* Stats row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '0.75rem' }} />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="skeleton" style={{ height: '400px', borderRadius: '0.75rem' }} />
    </div>
  );
}
