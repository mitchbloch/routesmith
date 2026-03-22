import Nav from '@/components/Nav';

export default function ResultsLoading() {
  return (
    <div className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Map placeholder */}
        <div className="h-[35vh] sm:h-[40vh] lg:h-full lg:flex-1 bg-gray-200 animate-pulse" />

        {/* Card placeholders */}
        <div className="flex-1 lg:w-96 lg:flex-none p-4 space-y-3">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
