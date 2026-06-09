import { getSkill } from '../data/skills';
import { getTypeMultiplier } from '../data/typeChart';
import type { PetInstance } from '../types';

export interface BattleState {
  player: PetInstance;
  enemy: PetInstance;
  turn: number;
  status: 'active' | 'won' | 'lost';
  log: string[];
}

export interface BattleAction {
  actorId: string;
  targetId: string;
  skillId: string;
  hit: boolean;
  damage: number;
  typeMultiplier: 2 | 1 | 0.5;
}

export interface BattleTurnResult extends BattleState {
  actions: BattleAction[];
  turnOrder: Array<{ actorId: string; skillId: string }>;
}

export function createBattleState(player: PetInstance, enemy: PetInstance): BattleState {
  return {
    player: { ...player },
    enemy: { ...enemy },
    turn: 1,
    status: 'active',
    log: [`野生的 ${enemy.nickname} 出现了。`]
  };
}

function calculateDamage(
  actor: PetInstance,
  target: PetInstance,
  skillId: string,
  typeMultiplier: 2 | 1 | 0.5
): number {
  const skill = getSkill(skillId);
  const levelBonus = 1 + actor.level * 0.035;
  const rawDamage =
    (skill.power + actor.attack * 0.9 - target.defense * 0.35) * typeMultiplier * levelBonus;
  return Math.max(1, Math.floor(rawDamage));
}

function applyDamage(target: PetInstance, damage: number): PetInstance {
  return {
    ...target,
    currentHp: Math.max(0, target.currentHp - damage)
  };
}

function describeMultiplier(multiplier: 2 | 1 | 0.5): string {
  if (multiplier === 2) {
    return '效果拔群';
  }
  if (multiplier === 0.5) {
    return '效果不佳';
  }
  return '效果普通';
}

export function performBattleTurn(
  state: BattleState,
  playerSkillId: string,
  enemySkillId: string,
  options: { random?: () => number } = {}
): BattleTurnResult {
  if (state.status !== 'active') {
    return { ...state, actions: [], turnOrder: [] };
  }

  let player = { ...state.player };
  let enemy = { ...state.enemy };
  const log = [...state.log, `第 ${state.turn} 回合开始。`];
  const random = options.random ?? Math.random;
  const firstIsPlayer = player.speed >= enemy.speed;
  const orderedTurns = firstIsPlayer
    ? [
        { actor: 'player' as const, skillId: playerSkillId },
        { actor: 'enemy' as const, skillId: enemySkillId }
      ]
    : [
        { actor: 'enemy' as const, skillId: enemySkillId },
        { actor: 'player' as const, skillId: playerSkillId }
      ];
  const actions: BattleAction[] = [];
  const turnOrder: Array<{ actorId: string; skillId: string }> = [];

  for (const entry of orderedTurns) {
    if (player.currentHp <= 0 || enemy.currentHp <= 0) {
      break;
    }

    const actor = entry.actor === 'player' ? player : enemy;
    const target = entry.actor === 'player' ? enemy : player;
    const skill = getSkill(entry.skillId);
    const typeMultiplier = getTypeMultiplier(skill.type, target.type);
    const hit = random() <= skill.accuracy;
    const damage = hit ? calculateDamage(actor, target, entry.skillId, typeMultiplier) : 0;
    const updatedTarget = hit ? applyDamage(target, damage) : target;

    turnOrder.push({ actorId: actor.id, skillId: entry.skillId });
    actions.push({
      actorId: actor.id,
      targetId: target.id,
      skillId: entry.skillId,
      hit,
      damage,
      typeMultiplier
    });

    if (hit) {
      log.push(
        `${actor.nickname} 使用 ${skill.name}，造成 ${damage} 点伤害。${describeMultiplier(
          typeMultiplier
        )}。`
      );
    } else {
      log.push(`${actor.nickname} 使用 ${skill.name}，但是落空了。`);
    }

    if (entry.actor === 'player') {
      enemy = updatedTarget;
    } else {
      player = updatedTarget;
    }
  }

  let status: BattleState['status'] = 'active';
  if (enemy.currentHp <= 0) {
    status = 'won';
    log.push(`${enemy.nickname} 失去战斗力。`);
  } else if (player.currentHp <= 0) {
    status = 'lost';
    log.push(`${player.nickname} 失去战斗力。`);
  }

  return {
    player,
    enemy,
    turn: state.turn + 1,
    status,
    log,
    actions,
    turnOrder
  };
}
