import { getItem } from '../data/items';
import type { PetInstance, Rarity, SaveState } from '../types';
import { consumeItem } from './inventorySystem';

const rarityCaptureRates: Record<Rarity, number> = {
  common: 0.48,
  uncommon: 0.34,
  rare: 0.21,
  epic: 0.12
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getCaptureChance(wildPet: PetInstance, itemId: string): number {
  const item = getItem(itemId);
  const hpRatio = wildPet.currentHp / wildPet.maxHp;
  const missingHpFactor = 1 - clamp(hpRatio, 0, 1);
  const baseRate = rarityCaptureRates[wildPet.rarity];
  const itemModifier = item.captureModifier ?? 1;
  return clamp(baseRate * itemModifier * (0.65 + missingHpFactor * 1.35), 0.04, 0.95);
}

export function attemptCapture(
  state: SaveState,
  wildPet: PetInstance,
  itemId: string,
  options: { random?: () => number } = {}
): { success: boolean; chance: number; state: SaveState; message: string } {
  const item = getItem(itemId);
  if (item.category !== 'capture') {
    return {
      success: false,
      chance: 0,
      state,
      message: `${item.name} 不是捕捉道具。`
    };
  }

  const consumed = consumeItem(state.inventory, itemId);
  if (!consumed.ok) {
    return {
      success: false,
      chance: 0,
      state,
      message: `${item.name} 不足。`
    };
  }

  const chance = getCaptureChance(wildPet, itemId);
  const success = (options.random ?? Math.random)() <= chance;
  const capturedPet: PetInstance = {
    ...wildPet,
    currentHp: wildPet.maxHp,
    intimacy: Math.max(wildPet.intimacy, 18),
    id: `${wildPet.speciesId}-captured-${Date.now().toString(36)}`
  };

  return {
    success,
    chance,
    state: {
      ...state,
      inventory: consumed.inventory,
      pets: success ? [...state.pets, capturedPet] : state.pets.slice(),
      discoveredSpecies: Array.from(new Set([...state.discoveredSpecies, wildPet.speciesId]))
    },
    message: success
      ? `${wildPet.nickname} 被温柔地收服，加入了你的萌灵列表。`
      : `${wildPet.nickname} 挣脱了光环。`
  };
}
