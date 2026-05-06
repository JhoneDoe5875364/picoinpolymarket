import { notFound } from "next/navigation";
import MarketsFeed from "@/components/market/MarketsFeed";
import { slugToCategory, slugToDiscovery } from "@/lib/market-categories";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const selectedDiscovery = slugToDiscovery(category);

  if (selectedDiscovery) {
    return (
      <MarketsFeed
        selectedCategory="All"
        selectedDiscovery={selectedDiscovery.key}
        selectedLabel={selectedDiscovery.label}
      />
    );
  }

  const selectedCategory = slugToCategory(category);

  if (!selectedCategory) {
    notFound();
  }

  return <MarketsFeed selectedCategory={selectedCategory} />;
}
