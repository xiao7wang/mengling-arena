import type { ItemDefinition } from '../types';

export const items: ItemDefinition[] = [
  {
    id: 'soothe-bell',
    name: '安抚铃',
    description: '轻响能稳定未驯服萌灵的情绪，驯服成功率小幅提升。',
    category: 'tame',
    price: 80,
    tameBonus: 0.1,
    appliesStatus: 'affinity'
  },
  {
    id: 'meling-snack',
    name: '萌灵点心',
    description: '带来亲和气息的小点心，会让目标进入亲和状态。',
    category: 'tame',
    price: 120,
    tameBonus: 0.15,
    appliesStatus: 'affinity',
    intimacyGain: 12
  },
  {
    id: 'spirit-stone',
    name: '灵契石',
    description: '用于建立稳定共鸣契约的石片。',
    category: 'tame',
    price: 180,
    tameBonus: 0.25
  },
  {
    id: 'resonance-mark',
    name: '共鸣印记',
    description: '稀有驯服道具，能显著提升契约回应。',
    category: 'tame',
    price: 360,
    tameBonus: 0.35
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
