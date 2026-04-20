import { notFound } from "next/navigation";
import MarketsFeed from "@/components/market/MarketsFeed";
import { slugToCategory } from "@/lib/market-categories";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const selectedCategory = slugToCategory(category);

  if (!selectedCategory) {
    notFound();
  }

  return <MarketsFeed selectedCategory={selectedCategory} />;
}
