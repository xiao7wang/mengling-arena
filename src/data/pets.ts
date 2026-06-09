import type { PetInstance, PetSpecies, Stats } from '../types';

let petCounter = 0;

export const petSpecies: PetSpecies[] = [
  {
    id: 'budfox',
    name: '芽狐',
    description: '森属性均衡型萌灵，擅长用藤叶缠绕和柔和回复维持节奏。',
    role: '均衡型',
    element: 'nature',
    type: 'nature',
    rarity: 'common',
    color: 0x69c77b,
    baseStats: { maxHp: 44, attack: 15, defense: 11, speed: 17 },
    growth: { maxHp: 7, attack: 3, defense: 2, speed: 3 },
    baseTameRate: 0.45,
    starter: true,
    skills: ['leaf-dart', 'mire-mist'],
    skillIds: ['leaf-dart', 'gust-whorl']
  },
  {
    id: 'cinderkit',
    name: '焰团喵',
    description: '焰属性攻击型萌灵，毛团里藏着爆发力，擅长制造灼痕。',
    role: '攻击型',
    element: 'flame',
    type: 'flame',
    rarity: 'rare',
    color: 0xff7a59,
    baseStats: { maxHp: 43, attack: 20, defense: 11, speed: 18 },
    growth: { maxHp: 7, attack: 5, defense: 2, speed: 3 },
    baseTameRate: 0.25,
    starter: true,
    skills: ['ember-hop', 'spark-bite'],
    skillIds: ['ember-hop', 'spark-bite']
  },
  {
    id: 'bubbleduck',
    name: '泡泡鸭',
    description: '澜属性防御型萌灵，会用泡沫护住自己并拖慢对手节奏。',
    role: '防御型',
    element: 'water',
    type: 'water',
    rarity: 'common',
    color: 0x74c9ff,
    baseStats: { maxHp: 52, attack: 12, defense: 17, speed: 10 },
    growth: { maxHp: 8, attack: 2, defense: 4, speed: 2 },
    baseTameRate: 0.45,
    starter: true,
    skills: ['water-pop', 'gust-whorl'],
    skillIds: ['water-pop', 'gust-whorl']
  },
  {
    id: 'glowdrop',
    name: '荧滴',
    description: '夜里会发出柔蓝微光的水滴萌灵，耐力可靠。',
    element: 'water',
    type: 'water',
    rarity: 'common',
    color: 0x54b4ff,
    baseStats: { maxHp: 48, attack: 13, defense: 13, speed: 12 },
    growth: { maxHp: 8, attack: 2, defense: 3, speed: 2 },
    baseTameRate: 0.45,
    skills: ['water-pop', 'gust-whorl'],
    skillIds: ['water-pop', 'gust-whorl']
  },
  {
    id: 'sparkit',
    name: '铃电狸',
    description: '尾尖像小铃一样聚电，心情好时会噼啪作响。',
    element: 'spark',
    type: 'spark',
    rarity: 'rare',
    color: 0xffd85c,
    baseStats: { maxHp: 40, attack: 18, defense: 10, speed: 20 },
    growth: { maxHp: 6, attack: 4, defense: 2, speed: 4 },
    baseTameRate: 0.25,
    skills: ['spark-bite', 'gust-whorl'],
    skillIds: ['spark-bite', 'gust-whorl']
  },
  {
    id: 'mossbun',
    name: '苔绒团',
    description: '看起来像一团会蹦的苔藓，亲密后很黏人。',
    element: 'stone',
    type: 'stone',
    rarity: 'rare',
    color: 0x8ea65e,
    baseStats: { maxHp: 52, attack: 14, defense: 18, speed: 9 },
    growth: { maxHp: 9, attack: 3, defense: 4, speed: 1 },
    baseTameRate: 0.25,
    skills: ['pebble-guard', 'leaf-dart'],
    skillIds: ['pebble-guard', 'leaf-dart']
  },
  {
    id: 'cloudlet',
    name: '云翎',
    description: '会把云絮梳成翅膀的风系萌灵，喜欢高处。',
    element: 'wind',
    type: 'wind',
    rarity: 'rare',
    color: 0xdbe9ff,
    baseStats: { maxHp: 39, attack: 16, defense: 10, speed: 24 },
    growth: { maxHp: 6, attack: 3, defense: 2, speed: 5 },
    baseTameRate: 0.25,
    skills: ['gust-whorl', 'water-pop'],
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
    element: species.element,
    type: species.type,
    rarity: species.rarity,
    color: species.color,
    level,
    experience: 0,
    intimacy: 20,
    hp: stats.maxHp,
    currentHp: stats.maxHp,
    baseTameRate: species.baseTameRate,
    statusEffects: [],
    skills: species.skillIds.slice(0, 2),
    skillIds: species.skillIds.slice(0, 2),
    ...stats
  };
}

export const starterSpecies = petSpecies.filter((species) => species.starter);

export function pickRandomPetSpecies(random = Math.random): PetSpecies {
  return petSpecies[Math.floor(random() * petSpecies.length)] ?? petSpecies[0];
}
