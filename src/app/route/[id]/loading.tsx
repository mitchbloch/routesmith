import Nav from '@/components/Nav';

export default function RouteDetailLoading() {
  return (
    <div className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Map placeholder */}
        <div className="h-[40vh] sm:h-[50vh] lg:h-full lg:flex-1 bg-gray-200 animate-pulse" />

        {/* Detail panel placeholder */}
        <div className="flex-1 lg:w-96 lg:flex-none overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Name */}
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center space-y-2">
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>

          {/* Score block */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-blue-100 rounded animate-pulse" />
              <div className="h-6 w-16 bg-blue-100 rounded animate-pulse" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-20 bg-blue-100 rounded animate-pulse" />
                <div className="h-3 w-8 bg-blue-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
