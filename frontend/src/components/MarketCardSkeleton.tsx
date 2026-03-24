export default function MarketCardSkeleton() {
  return (
    <div className="h-80 w-full rounded-xl border bg-black/10 border-white/10 p-4 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-20 rounded bg-white/10" />
        <div className="h-6 w-12 rounded bg-white/10" />
      </div>
      <div className="h-10 w-3/4 rounded bg-white/10 mb-6" />
      <div className="h-2 w-full rounded bg-white/10 mb-2" />
      <div className="h-5 w-16 mx-auto rounded bg-white/10 mb-6" />
      <div className="flex justify-center gap-12 mt-6">
        <div className="h-9 w-32 rounded bg-white/10" />
        <div className="h-9 w-32 rounded bg-white/10" />
      </div>
      <div className="flex justify-between text-xs mt-6">
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10" />
      </div>
    </div>
  );
}
