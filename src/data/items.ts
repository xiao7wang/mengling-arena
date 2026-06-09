import type { ItemDefinition } from '../types';

export const items: ItemDefinition[] = [
  {
    id: 'basic-orb',
    name: '朴素灵球',
    description: '基础捕捉道具，对低血量野生萌灵更有效。',
    category: 'capture',
    price: 80,
    captureModifier: 1
  },
  {
    id: 'gleam-orb',
    name: '微光灵球',
    description: '带有柔和光纹的捕捉道具，捕捉率更高。',
    category: 'capture',
    price: 180,
    captureModifier: 1.45
  },
  {
    id: 'berry-cake',
    name: '莓果糕',
    description: '家园常备点心，喂食后增加亲密度。',
    category: 'food',
    price: 35,
    intimacyGain: 12
  },
  {
    id: 'focus-card',
    name: '专注卡',
    description: '训练时使用，给予萌灵额外经验。',
    category: 'training',
    price: 50,
    trainingExp: 90
  },
  {
    id: 'dew-tonic',
    name: '清露药剂',
    description: '恢复萌灵生命值。',
    category: 'healing',
    price: 45,
    healAmount: 35
  }
];

export const itemsById = Object.fromEntries(items.map((item) => [item.id, item])) as Record<
  string,
  ItemDefinition
>;

export function getItem(itemId: string): ItemDefinition {
  const item = itemsById[itemId];
  if (!item) {
    throw new Error(`Unknown item: ${itemId}`);
  }
  return item;
}
