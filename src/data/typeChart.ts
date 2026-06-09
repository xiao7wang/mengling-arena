import type { ElementType } from '../types';

export const elementLabels: Record<ElementType, string> = {
  nature: '森',
  water: '泉',
  spark: '雷',
  flame: '焰',
  stone: '岩',
  wind: '风'
};

export const typeChart: Record<ElementType, Partial<Record<ElementType, 2 | 1 | 0.5>>> = {
  nature: {
    water: 2,
    stone: 2,
    flame: 0.5,
    wind: 0.5
  },
  water: {
    flame: 2,
    stone: 2,
    nature: 0.5,
    spark: 0.5
  },
  spark: {
    water: 2,
    wind: 2,
    nature: 0.5,
    stone: 0.5
  },
  flame: {
    nature: 2,
    wind: 2,
    water: 0.5,
    stone: 0.5
  },
  stone: {
    spark: 2,
    flame: 2,
    water: 0.5,
    nature: 0.5
  },
  wind: {
    nature: 2,
    spark: 0.5,
    flame: 0.5
  }
};

export function getTypeMultiplier(attacker: ElementType, defender: ElementType): 2 | 1 | 0.5 {
  return typeChart[attacker][defender] ?? 1;
}
