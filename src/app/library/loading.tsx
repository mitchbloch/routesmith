import Nav from '@/components/Nav';

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-12">
        <div className="mb-7">
          <p className="text-[12px] text-ink-faded mb-1">Saved routes</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold text-ink leading-tight tracking-tight">
            Library
          </h1>
        </div>
        <div className="text-center py-16">
          <div className="w-7 h-7 border-2 border-hairline border-t-vermillion rounded-full compass-spin mx-auto mb-3" />
          <p className="text-[12px] text-ink-faded">Loading</p>
        </div>
      </div>
    </div>
  );
}
