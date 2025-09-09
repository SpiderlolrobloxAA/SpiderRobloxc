export function normalizePrice(input: number, free: boolean): number {
  if (free) return 0;
  const n = Math.max(0, Math.floor(Number(input) || 0));
  return Math.max(3, n);
}

export function canPublish({ title, hasImage, price, free, balance, cost }: { title: string; hasImage: boolean; price: number; free: boolean; balance: number; cost: number; }): boolean {
  if (!title.trim()) return false;
  if (!hasImage) return false;
  if (balance < cost) return false;
  const normalized = normalizePrice(price, free);
  if (!free && normalized < 3) return false;
  return true;
}
