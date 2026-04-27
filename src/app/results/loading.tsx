import Nav from '@/components/Nav';
import CompassRose from '@/components/ornament/CompassRose';

export default function ResultsLoading() {
  return (
    <div className="h-screen flex flex-col bg-paper">
      <Nav />
      <div className="flex-1 flex items-center justify-center pt-14">
        <div className="text-center">
          <div className="text-ink mx-auto mb-5 w-fit">
            <CompassRose size={56} spin />
          </div>
          <p className="font-display text-[20px] text-ink leading-tight"
             style={{ fontVariationSettings: '"SOFT" 100, "opsz" 36' }}>
            Plotting your routes…
          </p>
          <p className="label-mono-sm mt-2">Surveying paths · scoring corridors</p>
        </div>
      </div>
    </div>
  );
}
