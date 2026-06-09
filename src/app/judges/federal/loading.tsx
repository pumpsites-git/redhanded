export default function Loading() {
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="skeleton" style={{ height: '32px', width: '300px', borderRadius: '4px', marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '0.75rem' }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: '500px', borderRadius: '0.75rem' }} />
    </div>
  );
}
