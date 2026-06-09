import type { Inventory } from '../types';

export function addItem(inventory: Inventory, itemId: string, quantity = 1): Inventory {
  return {
    ...inventory,
    [itemId]: (inventory[itemId] ?? 0) + Math.max(0, quantity)
  };
}

export function consumeItem(
  inventory: Inventory,
  itemId: string,
  quantity = 1
): { ok: boolean; inventory: Inventory } {
  const current = inventory[itemId] ?? 0;
  const amount = Math.max(0, quantity);
  if (current < amount) {
    return { ok: false, inventory: { ...inventory } };
  }
  return {
    ok: true,
    inventory: {
      ...inventory,
      [itemId]: current - amount
    }
  };
}

export function hasItem(inventory: Inventory, itemId: string, quantity = 1): boolean {
  return (inventory[itemId] ?? 0) >= quantity;
}
