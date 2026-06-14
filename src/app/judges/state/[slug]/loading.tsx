export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="skeleton h-8 w-48 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
