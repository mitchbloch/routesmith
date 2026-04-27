import Nav from '@/components/Nav';
import CompassRose from '@/components/ornament/CompassRose';

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-20 pb-12">
        <div className="mb-8">
          <p className="label-mono-sm">Your fieldbook · saved routes</p>
          <h1
            className="font-display text-[40px] sm:text-[48px] font-semibold text-ink leading-[1.0] tracking-tight mt-1"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 96' }}
          >
            The library.
          </h1>
        </div>
        <div className="text-center py-16">
          <div className="text-ink mx-auto mb-4 w-fit">
            <CompassRose size={40} spin />
          </div>
          <p className="label-mono-sm">Loading your fieldbook</p>
        </div>
      </div>
    </div>
  );
}
