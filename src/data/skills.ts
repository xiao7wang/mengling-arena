import type { SkillDefinition } from '../types';

export const skills: SkillDefinition[] = [
  {
    id: 'leaf-dart',
    name: '叶影飞针',
    type: 'nature',
    power: 18,
    accuracy: 0.95,
    description: '凝出细叶飞针攻击，适合压制泉系对手。'
  },
  {
    id: 'water-pop',
    name: '泡泡冲击',
    type: 'water',
    power: 16,
    accuracy: 0.98,
    description: '用弹跳水泡撞击目标，命中稳定。'
  },
  {
    id: 'spark-bite',
    name: '电光咬',
    type: 'spark',
    power: 20,
    accuracy: 0.9,
    description: '带着电火花突进撕咬。'
  },
  {
    id: 'ember-hop',
    name: '火星跃击',
    type: 'flame',
    power: 19,
    accuracy: 0.92,
    description: '借小火星起跳，落地时造成焰系伤害。'
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
