import type { SkillDefinition } from '../types';

export const skills: SkillDefinition[] = [
  {
    id: 'leaf-dart',
    name: '藤叶缠绕',
    type: 'nature',
    power: 18,
    accuracy: 0.95,
    description: '用柔韧藤叶束住目标，可能造成寒缚。',
    statusEffect: 'frostbind'
  },
  {
    id: 'water-pop',
    name: '泡沫缓流',
    type: 'water',
    power: 16,
    accuracy: 0.98,
    description: '用沉缓水泡包裹目标，可能造成寒缚。',
    statusEffect: 'frostbind'
  },
  {
    id: 'spark-bite',
    name: '眩星电闪',
    type: 'spark',
    power: 20,
    accuracy: 0.9,
    description: '释放星点般的电光，可能造成眩星。',
    statusEffect: 'daze'
  },
  {
    id: 'ember-hop',
    name: '灼痕跃击',
    type: 'flame',
    power: 19,
    accuracy: 0.92,
    description: '借小火星起跳，落地时可能留下灼痕。',
    statusEffect: 'scorch'
  },
  {
    id: 'pebble-guard',
    name: '碎岩冲',
    type: 'stone',
    power: 17,
    accuracy: 0.94,
    description: '卷起碎石直线冲撞。'
  },
  {
    id: 'gust-whorl',
    name: '旋风环',
    type: 'wind',
    power: 15,
    accuracy: 1,
    description: '释放一圈轻风，威力较低但不易落空。'
  },
  {
    id: 'mire-mist',
    name: '蚀雾轻触',
    type: 'nature',
    power: 14,
    accuracy: 0.9,
    description: '散开带有微弱蚀性的雾，可能造成毒蚀。',
    statusEffect: 'corrosion'
  }
];

export const skillsById = Object.fromEntries(skills.map((skill) => [skill.id, skill])) as Record<
  string,
  SkillDefinition
>;

export function getSkill(skillId: string): SkillDefinition {
  const skill = skillsById[skillId];
  if (!skill) {
    throw new Error(`Unknown skill: ${skillId}`);
  }
  return skill;
}
