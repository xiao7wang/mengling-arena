import { describe, expect, it } from 'vitest';
import { addItem, consumeItem } from './inventorySystem';

describe('inventorySystem', () => {
  it('adds and consumes stackable items without mutating the original inventory', () => {
    const inventory = { 'soothe-bell': 2 };
    const added = addItem(inventory, 'soothe-bell', 3);
    const consumed = consumeItem(added, 'soothe-bell', 4);

    expect(inventory['soothe-bell']).toBe(2);
    expect(added['soothe-bell']).toBe(5);
    expect(consumed.ok).toBe(true);
    expect(consumed.inventory['soothe-bell']).toBe(1);
  });

  it('refuses to consume more items than available', () => {
    const result = consumeItem({ 'soothe-bell': 1 }, 'soothe-bell', 2);

    expect(result.ok).toBe(false);
    expect(result.inventory['soothe-bell']).toBe(1);
  });
});
