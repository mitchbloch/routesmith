export default function WizardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg space-y-6">
        {/* Progress bar placeholder */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-1/6 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Title placeholder */}
        <div className="h-7 w-56 bg-gray-200 rounded animate-pulse mx-auto" />

        {/* Content area placeholder */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Navigation placeholder */}
        <div className="flex justify-end">
          <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
