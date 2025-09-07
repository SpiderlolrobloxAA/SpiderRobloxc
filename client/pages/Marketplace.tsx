import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard, type Product } from "@/components/ProductCard";

const sample: Product[] = Array.from({ length: 12 }).map((_, i) => ({
  id: String(i + 1),
  title: i % 3 === 0 ? `Brain Rot Premium #${1200 + i}` : `Brain Rot ${i + 1}`,
  price: (i % 5 === 0 ? 0 : 5 + (i % 7) * 3),
  free: i % 5 === 0,
  seller: { name: ["Aetherius", "NovaByte", "Zenku", "Kairox"][i % 4]!, role: (i % 4 === 0 ? "verified" : "user") },
  rating: 4 + ((i % 5) * 0.2),
}));

export default function Marketplace() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const products = sample
    .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sort === "price" ? a.price - b.price : b.id.localeCompare(a.id)));

  return (
    <div className="container py-10">
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 rounded-xl border border-border/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold">Marketplace</h1>
          <div className="flex flex-1 items-center gap-3 sm:justify-end">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, sellers…"
              className="w-full max-w-xl h-11 rounded-xl"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trier par" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Récents</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
