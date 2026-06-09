import { describe, expect, it } from 'vitest';
import { addItem, consumeItem } from './inventorySystem';

describe('inventorySystem', () => {
  it('adds and consumes stackable items without mutating the original inventory', () => {
    const inventory = { 'basic-orb': 2 };
    const added = addItem(inventory, 'basic-orb', 3);
    const consumed = consumeItem(added, 'basic-orb', 4);

    expect(inventory['basic-orb']).toBe(2);
    expect(added['basic-orb']).toBe(5);
    expect(consumed.ok).toBe(true);
    expect(consumed.inventory['basic-orb']).toBe(1);
  });

  it('refuses to consume more items than available', () => {
    const result = consumeItem({ 'basic-orb': 1 }, 'basic-orb', 2);

    expect(result.ok).toBe(false);
    expect(result.inventory['basic-orb']).toBe(1);
  });
});
