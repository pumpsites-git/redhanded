export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero skeleton */}
      <div className="skeleton h-44 rounded-xl mb-6" />
      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="skeleton h-96 rounded-xl" />
    </div>
  );
}
