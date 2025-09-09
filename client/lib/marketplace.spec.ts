import { describe, it, expect } from 'vitest';
import { normalizePrice, canPublish } from './marketplace';

describe('normalizePrice', () => {
  it('enforces free=0', () => {
    expect(normalizePrice(10, true)).toBe(0);
  });
  it('floors and min=3', () => {
    expect(normalizePrice(2.9, false)).toBe(3);
    expect(normalizePrice(0, false)).toBe(3);
    expect(normalizePrice(100, false)).toBe(100);
  });
});

describe('canPublish', () => {
  const base = { title: 'X', hasImage: true, price: 3, free: false, balance: 10, cost: 2 };
  it('needs title', () => {
    expect(canPublish({ ...base, title: '' })).toBe(false);
  });
  it('needs image', () => {
    expect(canPublish({ ...base, hasImage: false })).toBe(false);
  });
  it('needs balance >= cost', () => {
    expect(canPublish({ ...base, balance: 1, cost: 2 })).toBe(false);
  });
  it('min price 3 unless free', () => {
    expect(canPublish({ ...base, price: 2 })).toBe(false);
    expect(canPublish({ ...base, free: true, price: 0 })).toBe(true);
  });
});
