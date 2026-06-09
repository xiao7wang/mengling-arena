import type { PetInstance, PetSpecies, Stats } from '../types';

let petCounter = 0;

export const petSpecies: PetSpecies[] = [
  {
    id: 'budfox',
    name: '芽狐',
    description: '喜欢把嫩叶藏在耳后的森林小灵，速度灵巧。',
    type: 'nature',
    rarity: 'common',
    color: 0x69c77b,
    baseStats: { maxHp: 44, attack: 15, defense: 11, speed: 17 },
    growth: { maxHp: 7, attack: 3, defense: 2, speed: 3 },
    skillIds: ['leaf-dart', 'gust-whorl']
  },
  {
    id: 'glowdrop',
    name: '荧滴',
    description: '夜里会发出柔蓝微光的水滴精灵，耐力可靠。',
    type: 'water',
    rarity: 'common',
    color: 0x54b4ff,
    baseStats: { maxHp: 48, attack: 13, defense: 13, speed: 12 },
    growth: { maxHp: 8, attack: 2, defense: 3, speed: 2 },
    skillIds: ['water-pop', 'gust-whorl']
  },
  {
    id: 'sparkit',
    name: '铃电狸',
    description: '尾尖像小铃一样聚电，心情好时会噼啪作响。',
    type: 'spark',
    rarity: 'uncommon',
    color: 0xffd85c,
    baseStats: { maxHp: 40, attack: 18, defense: 10, speed: 20 },
    growth: { maxHp: 6, attack: 4, defense: 2, speed: 4 },
    skillIds: ['spark-bite', 'gust-whorl']
  },
  {
    id: 'mossbun',
    name: '苔绒团',
    description: '看起来像一团会蹦的苔藓，亲密后很黏人。',
    type: 'stone',
    rarity: 'uncommon',
    color: 0x8ea65e,
    baseStats: { maxHp: 52, attack: 14, defense: 18, speed: 9 },
    growth: { maxHp: 9, attack: 3, defense: 4, speed: 1 },
    skillIds: ['pebble-guard', 'leaf-dart']
  },
  {
    id: 'cinderkit',
    name: '烁焰崽',
    description: '小小的焰系萌灵，斗志被夸奖点燃得最快。',
    type: 'flame',
    rarity: 'rare',
    color: 0xff7a59,
    baseStats: { maxHp: 43, attack: 20, defense: 11, speed: 18 },
    growth: { maxHp: 7, attack: 5, defense: 2, speed: 3 },
    skillIds: ['ember-hop', 'spark-bite']
  },
  {
    id: 'cloudlet',
    name: '云翎',
    description: '会把云絮梳成翅膀的风系萌灵，喜欢高处。',
    type: 'wind',
    rarity: 'rare',
    color: 0xdbe9ff,
    baseStats: { maxHp: 39, attack: 16, defense: 10, speed: 24 },
    growth: { maxHp: 6, attack: 3, defense: 2, speed: 5 },
    skillIds: ['gust-whorl', 'water-pop']
  }
];

export const petSpeciesById = Object.fromEntries(
  petSpecies.map((species) => [species.id, species])
) as Record<string, PetSpecies>;

export function getPetSpecies(speciesId: string): PetSpecies {
  const species = petSpeciesById[speciesId];
  if (!species) {
    throw new Error(`Unknown pet species: ${speciesId}`);
  }
  return species;
}

export function getStatsAtLevel(species: PetSpecies, level: number): Stats {
  const levelOffset = Math.max(0, level - 1);
  return {
    maxHp: species.baseStats.maxHp + species.growth.maxHp * levelOffset,
    attack: species.baseStats.attack + species.growth.attack * levelOffset,
    defense: species.baseStats.defense + species.growth.defense * levelOffset,
    speed: species.baseStats.speed + species.growth.speed * levelOffset
  };
}

export function getExperienceToNextLevel(level: number): number {
  return 80 + level * 40;
}

export function clonePetForPlayer(speciesId: string, level = 1): PetInstance {
  const species = getPetSpecies(speciesId);
  const stats = getStatsAtLevel(species, level);
  petCounter += 1;
  return {
    id: `${speciesId}-${Date.now().toString(36)}-${petCounter}`,
    speciesId,
    nickname: species.name,
    type: species.type,
    rarity: species.rarity,
    color: species.color,
    level,
    experience: 0,
    intimacy: 20,
    currentHp: stats.maxHp,
    skillIds: species.skillIds.slice(0, 2),
    ...stats
  };
}
