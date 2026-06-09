import { describe, expect, it } from 'vitest';
import {
  createBattleState,
  performBasicAttackTurn,
  performBattleTurn,
  performPlayerSkillTurn
} from './battleSystem';
import { clonePetForPlayer } from '../data/pets';
import { skillsById } from '../data/skills';

describe('battleSystem', () => {
  it('lets the faster pet act first and records every action in the log', () => {
    const player = clonePetForPlayer('budfox', 5);
    const untamed = clonePetForPlayer('glowdrop', 5);
    player.speed = 21;
    untamed.speed = 12;

    const battle = createBattleState(player, untamed);
    const result = performBattleTurn(battle, 'leaf-dart', 'water-pop');

    expect(result.turnOrder.map((action) => action.actorId)).toEqual([player.id, untamed.id]);
    expect(result.log.length).toBeGreaterThanOrEqual(3);
    expect(result.log.some((line) => line.includes(`${player.nickname} 使用`))).toBe(true);
  });

  it('applies type effectiveness multipliers when calculating skill damage', () => {
    const player = clonePetForPlayer('budfox', 5);
    const untamed = clonePetForPlayer('glowdrop', 5);
    const battle = createBattleState(player, untamed);

    const result = performBattleTurn(battle, 'leaf-dart', 'water-pop', {
      random: () => 0
    });

    expect(result.actions[0].skillId).toBe('leaf-dart');
    expect(result.actions[0].typeMultiplier).toBe(2);
    expect(result.actions[0].damage).toBeGreaterThan(skillsById['leaf-dart'].power);
  });

  it('lets a basic attack happen before the enemy counterattack', () => {
    const player = clonePetForPlayer('budfox', 5);
    const enemy = clonePetForPlayer('glowdrop', 5);
    const battle = createBattleState(player, enemy);

    const result = performBasicAttackTurn(battle);

    expect(result.actions[0].actorId).toBe(player.id);
    expect(result.actions[0].skillId).toBe('basic-attack');
    expect(result.enemy.currentHp).toBeLessThan(enemy.currentHp);
    expect(result.player.currentHp).toBeLessThan(player.currentHp);
  });

  it('applies skill statuses and fatigue when the untamed spirit is weakened', () => {
    const player = clonePetForPlayer('cinderkit', 5);
    const enemy = clonePetForPlayer('budfox', 5);
    enemy.currentHp = Math.ceil(enemy.maxHp * 0.3);
    const battle = createBattleState(player, enemy);

    const result = performPlayerSkillTurn(battle, 'ember-hop', {
      random: () => 0
    });

    expect(result.enemy.statusEffects).toContain('scorch');
    expect(result.enemy.statusEffects).toContain('fatigue');
  });
});
