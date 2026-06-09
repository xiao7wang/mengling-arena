import { getItem } from '../data/items';
import type { PetInstance, Rarity, SaveState, StatusEffectId } from '../types';
import { consumeItem } from './inventorySystem';

const rarityBaseTameRates: Record<Rarity, number> = {
  common: 0.45,
  rare: 0.25,
  epic: 0.12,
  legendary: 0.05
};

const statusTameBonuses: Record<StatusEffectId, number> = {
  corrosion: 0.08,
  frostbind: 0.12,
  scorch: 0.06,
  daze: 0.15,
  fatigue: 0.2,
  fear: -0.2,
  affinity: 0.25
};

export interface TameChanceBreakdown {
  baseTameRate: number;
  lowHpBonus: number;
  statusBonus: number;
  itemBonus: number;
  rarityPenalty: number;
  fearPenalty: number;
}

export interface TameChanceResult {
  chance: number;
  breakdown: TameChanceBreakdown;
}

export interface TameAttemptResult {
  success: boolean;
  consumedItem: boolean;
  chance: number;
  state: SaveState;
  untamedPet: PetInstance;
  message: string;
}

export function getTameChance(untamedPet: PetInstance, itemId: string): TameChanceResult {
  const item = getItem(itemId);
  const statuses = new Set(untamedPet.statusEffects);
  if (item.appliesStatus) {
    statuses.add(item.appliesStatus);
  }

  const baseTameRate = untamedPet.baseTameRate ?? rarityBaseTameRates[untamedPet.rarity];
  const hpRatio = untamedPet.currentHp / untamedPet.maxHp;
  const lowHpBonus = hpRatio < 0.25 ? 0.25 : hpRatio < 0.5 ? 0.1 : 0;
  const statusBonus = Array.from(statuses).reduce(
    (sum, status) => sum + statusTameBonuses[status],
    0
  );
  const itemBonus = item.tameBonus ?? 0;
  const fearPenalty = statuses.has('fear') ? 0.2 : 0;
  const rarityPenalty = 0;
  const chance = clamp(baseTameRate + lowHpBonus + statusBonus + itemBonus - rarityPenalty, 0.02, 0.95);

  return {
    chance,
    breakdown: {
      baseTameRate,
      lowHpBonus,
      statusBonus,
      itemBonus,
      rarityPenalty,
      fearPenalty
    }
  };
}

export function attemptTame(
  state: SaveState,
  untamedPet: PetInstance,
  itemId: string,
  options: { random?: () => number } = {}
): TameAttemptResult {
  const item = getItem(itemId);
  if (item.category !== 'tame') {
    return {
      success: false,
      consumedItem: false,
      chance: 0,
      state,
      untamedPet,
      message: `${item.name} 不能用于共鸣契约。`
    };
  }

  const consumed = consumeItem(state.inventory, itemId);
  if (!consumed.ok) {
    return {
      success: false,
      consumedItem: false,
      chance: 0,
      state,
      untamedPet,
      message: `${item.name} 道具不足，无法尝试驯服。`
    };
  }

  const adjustedTarget = item.appliesStatus ? addStatus(untamedPet, item.appliesStatus) : untamedPet;
  const chance = getTameChance(adjustedTarget, itemId).chance;
  const success = (options.random ?? Math.random)() <= chance;
  const contractedPet: PetInstance = {
    ...adjustedTarget,
    currentHp: adjustedTarget.maxHp,
    hp: adjustedTarget.maxHp,
    intimacy: Math.max(adjustedTarget.intimacy, 25),
    statusEffects: [],
    id: `${adjustedTarget.speciesId}-tamed-${Date.now().toString(36)}`
  };

  return {
    success,
    consumedItem: true,
    chance,
    untamedPet: adjustedTarget,
    state: {
      ...state,
      inventory: consumed.inventory,
      pets: success ? [...state.pets, contractedPet] : state.pets.slice(),
      discoveredSpecies: Array.from(new Set([...state.discoveredSpecies, adjustedTarget.speciesId]))
    },
    message: success
      ? `${adjustedTarget.nickname} 回应了共鸣契约，加入了你的萌灵列表。`
      : `${adjustedTarget.nickname} 仍然保持警惕，共鸣没有稳定下来。`
  };
}

function addStatus(pet: PetInstance, status: StatusEffectId): PetInstance {
  if (pet.statusEffects.includes(status)) {
    return pet;
  }
  return {
    ...pet,
    statusEffects: [...pet.statusEffects, status]
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
