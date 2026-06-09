import { getSkill } from '../data/skills';
import { getTypeMultiplier } from '../data/typeChart';
import type { PetInstance, StatusEffectId } from '../types';

export interface BattleState {
  player: PetInstance;
  enemy: PetInstance;
  turn: number;
  status: 'active' | 'won' | 'lost';
  log: string[];
  playerHighDamageStreak: number;
}

export interface BattleAction {
  actorId: string;
  targetId: string;
  skillId: string;
  hit: boolean;
  damage: number;
  typeMultiplier: 2 | 1 | 0.5;
  statusApplied?: StatusEffectId;
}

export interface BattleTurnResult extends BattleState {
  actions: BattleAction[];
  turnOrder: Array<{ actorId: string; skillId: string }>;
}

export const statusLabels: Record<StatusEffectId, string> = {
  corrosion: '毒蚀',
  frostbind: '寒缚',
  scorch: '灼痕',
  daze: '眩星',
  fatigue: '疲惫',
  fear: '惊惧',
  affinity: '亲和'
};

export function createBattleState(player: PetInstance, enemy: PetInstance): BattleState {
  return {
    player: ensureBattlePet(player),
    enemy: ensureBattlePet(enemy),
    turn: 1,
    status: 'active',
    log: [`未驯服萌灵 ${enemy.nickname} 出现了。`],
    playerHighDamageStreak: 0
  };
}

export function addStatusEffect(pet: PetInstance, status: StatusEffectId): PetInstance {
  if (pet.statusEffects.includes(status)) {
    return pet;
  }
  return {
    ...pet,
    statusEffects: [...pet.statusEffects, status]
  };
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

  let player = ensureBattlePet(state.player);
  let enemy = ensureBattlePet(state.enemy);
  const log = [...state.log, `第 ${state.turn} 回合开始。`];
  const random = options.random ?? Math.random;
  const firstIsPlayer = getEffectiveSpeed(player) >= getEffectiveSpeed(enemy);
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
  let playerHighDamageStreak = state.playerHighDamageStreak;

  for (const entry of orderedTurns) {
    if (player.currentHp <= 0 || enemy.currentHp <= 0) {
      break;
    }

    const result = applySkillAction(
      entry.actor === 'player' ? player : enemy,
      entry.actor === 'player' ? enemy : player,
      entry.skillId,
      random
    );
    turnOrder.push({ actorId: result.action.actorId, skillId: entry.skillId });
    actions.push(result.action);
    log.push(result.message);

    if (entry.actor === 'player') {
      enemy = updateUntamedAfterPlayerDamage(result.target, result.action.damage, playerHighDamageStreak);
      playerHighDamageStreak = updateHighDamageStreak(result.action.damage, result.target.maxHp, playerHighDamageStreak);
      if (enemy.statusEffects.includes('fear')) {
        log.push(`${enemy.nickname} 进入惊惧状态，契约回应会变得更不稳定。`);
      }
    } else {
      player = result.target;
    }
  }

  return finishTurn({
    state,
    player,
    enemy,
    log,
    actions,
    turnOrder,
    playerHighDamageStreak
  });
}

export function performPlayerSkillTurn(
  state: BattleState,
  playerSkillId: string,
  options: { random?: () => number } = {}
): BattleTurnResult {
  if (state.status !== 'active') {
    return { ...state, actions: [], turnOrder: [] };
  }
  const random = options.random ?? Math.random;
  const log = [...state.log, `第 ${state.turn} 回合开始。`];
  const actions: BattleAction[] = [];
  const turnOrder: Array<{ actorId: string; skillId: string }> = [];
  let player = ensureBattlePet(state.player);
  let enemy = ensureBattlePet(state.enemy);
  let playerHighDamageStreak = state.playerHighDamageStreak;

  const playerAction = applySkillAction(player, enemy, playerSkillId, random);
  actions.push(playerAction.action);
  turnOrder.push({ actorId: player.id, skillId: playerSkillId });
  log.push(playerAction.message);
  enemy = updateUntamedAfterPlayerDamage(
    playerAction.target,
    playerAction.action.damage,
    playerHighDamageStreak
  );
  playerHighDamageStreak = updateHighDamageStreak(
    playerAction.action.damage,
    playerAction.target.maxHp,
    playerHighDamageStreak
  );

  if (enemy.currentHp > 0) {
    const counter = applySkillAction(enemy, player, enemy.skillIds[0], random);
    actions.push(counter.action);
    turnOrder.push({ actorId: enemy.id, skillId: enemy.skillIds[0] });
    log.push(counter.message);
    player = counter.target;
  }

  return finishTurn({
    state,
    player,
    enemy,
    log,
    actions,
    turnOrder,
    playerHighDamageStreak
  });
}

export function performBasicAttackTurn(
  state: BattleState,
  options: { random?: () => number } = {}
): BattleTurnResult {
  if (state.status !== 'active') {
    return { ...state, actions: [], turnOrder: [] };
  }
  const random = options.random ?? Math.random;
  const log = [...state.log, `第 ${state.turn} 回合开始。`];
  const actions: BattleAction[] = [];
  const turnOrder: Array<{ actorId: string; skillId: string }> = [];
  let player = ensureBattlePet(state.player);
  let enemy = ensureBattlePet(state.enemy);
  let playerHighDamageStreak = state.playerHighDamageStreak;

  const damage = calculateBasicDamage(player, enemy);
  enemy = applyDamage(enemy, damage);
  const playerAction: BattleAction = {
    actorId: player.id,
    targetId: enemy.id,
    skillId: 'basic-attack',
    hit: true,
    damage,
    typeMultiplier: 1
  };
  actions.push(playerAction);
  turnOrder.push({ actorId: player.id, skillId: 'basic-attack' });
  log.push(`${player.nickname} 发起普通攻击，造成 ${damage} 点伤害。`);
  enemy = updateUntamedAfterPlayerDamage(enemy, damage, playerHighDamageStreak);
  playerHighDamageStreak = updateHighDamageStreak(damage, enemy.maxHp, playerHighDamageStreak);

  if (enemy.currentHp > 0) {
    const counter = applySkillAction(enemy, player, enemy.skillIds[0], random);
    actions.push(counter.action);
    turnOrder.push({ actorId: enemy.id, skillId: enemy.skillIds[0] });
    log.push(counter.message);
    player = counter.target;
  }

  return finishTurn({
    state,
    player,
    enemy,
    log,
    actions,
    turnOrder,
    playerHighDamageStreak
  });
}

export function performEnemyCounterTurn(
  state: BattleState,
  openingLog: string,
  options: { random?: () => number } = {}
): BattleTurnResult {
  if (state.status !== 'active') {
    return { ...state, actions: [], turnOrder: [] };
  }
  const random = options.random ?? Math.random;
  let player = ensureBattlePet(state.player);
  const enemy = ensureBattlePet(state.enemy);
  const log = [...state.log, openingLog];
  const actions: BattleAction[] = [];
  const turnOrder: Array<{ actorId: string; skillId: string }> = [];

  if (enemy.currentHp > 0) {
    const counter = applySkillAction(enemy, player, enemy.skillIds[0], random);
    actions.push(counter.action);
    turnOrder.push({ actorId: enemy.id, skillId: enemy.skillIds[0] });
    log.push(counter.message);
    player = counter.target;
  }

  return finishTurn({
    state,
    player,
    enemy,
    log,
    actions,
    turnOrder,
    playerHighDamageStreak: state.playerHighDamageStreak
  });
}

function ensureBattlePet(pet: PetInstance): PetInstance {
  return {
    ...pet,
    hp: pet.hp ?? pet.currentHp,
    currentHp: pet.currentHp ?? pet.hp,
    statusEffects: pet.statusEffects ?? [],
    skills: pet.skills ?? pet.skillIds,
    skillIds: pet.skillIds ?? pet.skills
  };
}

function applySkillAction(
  actor: PetInstance,
  target: PetInstance,
  skillId: string,
  random: () => number
): { action: BattleAction; target: PetInstance; message: string } {
  const skill = getSkill(skillId);
  const typeMultiplier = getTypeMultiplier(skill.type, target.type);
  const hit = random() <= skill.accuracy;
  let damage = 0;
  let updatedTarget = target;
  let statusApplied: StatusEffectId | undefined;

  if (hit) {
    damage = calculateSkillDamage(actor, target, skillId, typeMultiplier);
    updatedTarget = applyDamage(target, damage);
    if (skill.statusEffect && random() <= 0.65) {
      updatedTarget = addStatusEffect(updatedTarget, skill.statusEffect);
      statusApplied = skill.statusEffect;
    }
  }

  const action: BattleAction = {
    actorId: actor.id,
    targetId: target.id,
    skillId,
    hit,
    damage,
    typeMultiplier,
    statusApplied
  };

  if (!hit) {
    return {
      action,
      target: updatedTarget,
      message: `${actor.nickname} 使用 ${skill.name}，但是没能命中。`
    };
  }

  const statusText = statusApplied ? ` ${target.nickname} 受到${statusLabels[statusApplied]}影响。` : '';
  return {
    action,
    target: updatedTarget,
    message: `${actor.nickname} 使用 ${skill.name}，造成 ${damage} 点伤害。${describeMultiplier(
      typeMultiplier
    )}${statusText}`
  };
}

function calculateSkillDamage(
  actor: PetInstance,
  target: PetInstance,
  skillId: string,
  typeMultiplier: 2 | 1 | 0.5
): number {
  const skill = getSkill(skillId);
  const attack = actor.statusEffects.includes('scorch') ? actor.attack * 0.75 : actor.attack;
  const levelBonus = 1 + actor.level * 0.035;
  const rawDamage = (skill.power + attack * 0.9 - target.defense * 0.35) * typeMultiplier * levelBonus;
  return Math.max(1, Math.floor(rawDamage));
}

function calculateBasicDamage(actor: PetInstance, target: PetInstance): number {
  const attack = actor.statusEffects.includes('scorch') ? actor.attack * 0.75 : actor.attack;
  return Math.max(1, Math.floor(attack * 0.85 + actor.level * 1.8 - target.defense * 0.35));
}

function applyDamage(target: PetInstance, damage: number): PetInstance {
  const currentHp = Math.max(0, target.currentHp - damage);
  return {
    ...target,
    currentHp,
    hp: currentHp
  };
}

function updateUntamedAfterPlayerDamage(
  enemy: PetInstance,
  damage: number,
  previousHighDamageStreak: number
): PetInstance {
  let updated = enemy;
  if (updated.currentHp / updated.maxHp <= 0.35) {
    updated = addStatusEffect(updated, 'fatigue');
  }
  const highDamageStreak = updateHighDamageStreak(damage, updated.maxHp, previousHighDamageStreak);
  if (highDamageStreak >= 2) {
    updated = addStatusEffect(updated, 'fear');
  }
  return updated;
}

function updateHighDamageStreak(damage: number, targetMaxHp: number, previous: number): number {
  return damage >= targetMaxHp * 0.3 ? previous + 1 : 0;
}

function getEffectiveSpeed(pet: PetInstance): number {
  return pet.statusEffects.includes('frostbind') ? Math.floor(pet.speed * 0.65) : pet.speed;
}

function finishTurn(args: {
  state: BattleState;
  player: PetInstance;
  enemy: PetInstance;
  log: string[];
  actions: BattleAction[];
  turnOrder: Array<{ actorId: string; skillId: string }>;
  playerHighDamageStreak: number;
}): BattleTurnResult {
  let { player, enemy, log } = args;
  let status: BattleState['status'] = 'active';

  const corrosionResult = applyCorrosion(player, enemy);
  player = corrosionResult.player;
  enemy = corrosionResult.enemy;
  log = [...log, ...corrosionResult.log];

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
    turn: args.state.turn + 1,
    status,
    log,
    actions: args.actions,
    turnOrder: args.turnOrder,
    playerHighDamageStreak: args.playerHighDamageStreak
  };
}

function applyCorrosion(player: PetInstance, enemy: PetInstance) {
  const log: string[] = [];
  let updatedPlayer = player;
  let updatedEnemy = enemy;
  if (player.currentHp > 0 && player.statusEffects.includes('corrosion')) {
    const damage = Math.max(1, Math.floor(player.maxHp * 0.05));
    updatedPlayer = applyDamage(player, damage);
    log.push(`${player.nickname} 被毒蚀消耗了 ${damage} 点体力。`);
  }
  if (enemy.currentHp > 0 && enemy.statusEffects.includes('corrosion')) {
    const damage = Math.max(1, Math.floor(enemy.maxHp * 0.05));
    updatedEnemy = applyDamage(enemy, damage);
    log.push(`${enemy.nickname} 被毒蚀消耗了 ${damage} 点体力。`);
  }
  return { player: updatedPlayer, enemy: updatedEnemy, log };
}

function describeMultiplier(multiplier: 2 | 1 | 0.5): string {
  if (multiplier === 2) {
    return '效果强烈。';
  }
  if (multiplier === 0.5) {
    return '效果较弱。';
  }
  return '效果稳定。';
}
