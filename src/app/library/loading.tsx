import Nav from '@/components/Nav';

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Filter bar placeholder */}
        <div className="flex gap-2 mb-4">
          <div className="h-9 w-60 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Card placeholders */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
              <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-3">
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
