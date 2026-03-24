import MarketList from "@/components/MarketList";
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="container py-8 px-4 sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1200px] text-left mb-8 sm:mb-10">
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
          Prediction Markets powered by <span className="text-primary">Pi</span>
        </h1>
        <p className="text-white/80 mt-3 sm:mt-4">Browse and forecast on a variety of markets.</p>
        <p className="text-xs text-white/60 mt-1" data-qa="canary">
        </p>
      </section>
      <section className="mx-auto max-w-[1200px] px-0 sm:px-0">
        <MarketList limit={18} />
      </section>
    </div>
  );
}
