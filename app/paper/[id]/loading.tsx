export default function Loading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title Skeleton */}
        <div className="mb-8 animate-fade-in">
          <div className="h-10 w-96 bg-linear-to-r from-purple-200 to-teal-200 rounded-xl mb-3 animate-pulse" />
          <div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Loading Spinner with Gradient */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-teal-400 opacity-20" />
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Loading paper details...</p>
        </div>

        {/* Units Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`p-6 bg-white rounded-2xl shadow-sm animate-pulse stagger-${i}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-200 to-teal-200" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-6 bg-gray-200 rounded-lg mb-2 w-4/5" />
              <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
