export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="skeleton h-32 rounded-xl" />
      <div className="skeleton h-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
