import type { MapDefinition } from '../types';

export const maps: MapDefinition[] = [
  {
    id: 'whisper-woods',
    name: '絮语林地',
    description: '适合初次探索的温和林地，常见森系和岩系萌灵。',
    color: 0x4ca66a,
    encounters: [
      { speciesId: 'budfox', weight: 45, minLevel: 2, maxLevel: 5 },
      { speciesId: 'mossbun', weight: 30, minLevel: 3, maxLevel: 6 },
      { speciesId: 'cloudlet', weight: 10, minLevel: 4, maxLevel: 7 }
    ]
  },
  {
    id: 'shimmer-brook',
    name: '微光溪岸',
    description: '溪水边闪着细碎光点，澜系萌灵经常在这里玩耍。',
    color: 0x4aa7c8,
    encounters: [
      { speciesId: 'glowdrop', weight: 50, minLevel: 2, maxLevel: 5 },
      { speciesId: 'sparkit', weight: 24, minLevel: 3, maxLevel: 6 },
      { speciesId: 'budfox', weight: 18, minLevel: 3, maxLevel: 6 }
    ]
  },
  {
    id: 'cinder-ridge',
    name: '烁石山脊',
    description: '暖风吹过碎石山脊，稀有焰系萌灵偶尔现身。',
    color: 0xbe6950,
    encounters: [
      { speciesId: 'mossbun', weight: 30, minLevel: 4, maxLevel: 8 },
      { speciesId: 'cinderkit', weight: 18, minLevel: 5, maxLevel: 8 },
      { speciesId: 'cloudlet', weight: 24, minLevel: 4, maxLevel: 7 }
    ]
  }
];

export const mapsById = Object.fromEntries(maps.map((map) => [map.id, map])) as Record<
  string,
  MapDefinition
>;

export function getMap(mapId: string): MapDefinition {
  const map = mapsById[mapId];
  if (!map) {
    throw new Error(`Unknown map: ${mapId}`);
  }
  return map;
}

export function pickEncounter(mapId: string, random = Math.random) {
  const map = getMap(mapId);
  const totalWeight = map.encounters.reduce((sum, encounter) => sum + encounter.weight, 0);
  let roll = random() * totalWeight;
  const encounter = map.encounters.find((entry) => {
    roll -= entry.weight;
    return roll <= 0;
  }) ?? map.encounters[0];
  const levelRange = encounter.maxLevel - encounter.minLevel + 1;
  const level = encounter.minLevel + Math.floor(random() * levelRange);
  return {
    speciesId: encounter.speciesId,
    level
  };
}
