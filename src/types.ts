export type ElementType = 'nature' | 'water' | 'spark' | 'flame' | 'stone' | 'wind';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type SceneKey = 'menu' | 'home' | 'map' | 'battle' | 'dex' | 'bag';

export interface Stats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface PetSpecies {
  id: string;
  name: string;
  description: string;
  type: ElementType;
  rarity: Rarity;
  color: number;
  baseStats: Stats;
  growth: Stats;
  skillIds: string[];
}

export interface PetInstance extends Stats {
  id: string;
  speciesId: string;
  nickname: string;
  type: ElementType;
  rarity: Rarity;
  color: number;
  level: number;
  experience: number;
  intimacy: number;
  currentHp: number;
  skillIds: string[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  type: ElementType;
  power: number;
  accuracy: number;
  description: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: 'capture' | 'food' | 'training' | 'healing';
  price: number;
  captureModifier?: number;
  intimacyGain?: number;
  trainingExp?: number;
  healAmount?: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  color: number;
  encounters: Array<{
    speciesId: string;
    weight: number;
    minLevel: number;
    maxLevel: number;
  }>;
}

export type Inventory = Record<string, number>;

export interface SaveState {
  playerName: string;
  coins: number;
  pets: PetInstance[];
  activePetId: string;
  inventory: Inventory;
  discoveredSpecies: string[];
  visitedMaps: string[];
  lastSavedAt: string;
}
