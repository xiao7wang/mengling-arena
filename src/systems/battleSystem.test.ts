import { describe, expect, it } from 'vitest';
import { createBattleState, performBattleTurn } from './battleSystem';
import { clonePetForPlayer } from '../data/pets';
import { skillsById } from '../data/skills';

describe('battleSystem', () => {
  it('lets the faster pet act first and records every action in the log', () => {
    const player = clonePetForPlayer('budfox', 5);
    const wild = clonePetForPlayer('glowdrop', 5);
    player.speed = 21;
    wild.speed = 12;

    const battle = createBattleState(player, wild);
    const result = performBattleTurn(battle, 'leaf-dart', 'water-pop');

    expect(result.turnOrder.map((action) => action.actorId)).toEqual([player.id, wild.id]);
    expect(result.log.length).toBeGreaterThanOrEqual(3);
    expect(result.log.some((line) => line.includes(`${player.nickname} 使用`))).toBe(true);
  });

  it('applies type effectiveness multipliers when calculating skill damage', () => {
    const player = clonePetForPlayer('budfox', 5);
    const wild = clonePetForPlayer('glowdrop', 5);
    const battle = createBattleState(player, wild);

    const result = performBattleTurn(battle, 'leaf-dart', 'water-pop', {
      random: () => 0
    });

    expect(result.actions[0].skillId).toBe('leaf-dart');
    expect(result.actions[0].typeMultiplier).toBe(2);
    expect(result.actions[0].damage).toBeGreaterThan(skillsById['leaf-dart'].power);
  });
});
