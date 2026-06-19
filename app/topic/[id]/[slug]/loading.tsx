export default function Loading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title and Badge Skeleton */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-96 bg-linear-to-r from-purple-200 to-teal-200 rounded-xl animate-pulse" />
            <div className="h-7 w-20 bg-purple-200 rounded-full animate-pulse" />
          </div>
          <div className="h-5 w-80 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Loading Spinner with Gradient */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-teal-400 opacity-20" />
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Loading topic details...</p>
        </div>

        {/* Content Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm p-8 animate-slide-up">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-4/5 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
