import { describe, expect, it } from 'vitest';
import { clonePetForPlayer } from '../data/pets';
import type { StatusEffectId } from '../types';
import { createDefaultSaveState } from './saveSystem';
import { attemptTame, getTameChance } from './tameSystem';

describe('tameSystem', () => {
  it('raises tame chance when hp is low and affinity status is present', () => {
    const untamed = clonePetForPlayer('mossbun', 4);
    const calmTarget = {
      ...untamed,
      currentHp: Math.floor(untamed.maxHp * 0.8),
      statusEffects: []
    };
    const weakenedTarget = {
      ...untamed,
      currentHp: 1,
      statusEffects: ['fatigue', 'affinity'] satisfies StatusEffectId[]
    };

    const calmChance = getTameChance(calmTarget, 'soothe-bell');
    const weakenedChance = getTameChance(weakenedTarget, 'spirit-stone');

    expect(weakenedChance.chance).toBeGreaterThan(calmChance.chance);
    expect(weakenedChance.breakdown.statusBonus).toBeGreaterThan(0);
  });

  it('consumes a tame item and adds the untamed spirit to the player list on success', () => {
    const save = createDefaultSaveState('budfox');
    const untamed = clonePetForPlayer('sparkit', 3);
    untamed.currentHp = 1;

    const result = attemptTame(save, untamed, 'spirit-stone', {
      random: () => 0
    });

    expect(result.success).toBe(true);
    expect(result.state.pets.some((pet) => pet.speciesId === 'sparkit')).toBe(true);
    expect(result.state.inventory['spirit-stone']).toBe(save.inventory['spirit-stone'] - 1);
    expect(result.state.discoveredSpecies).toContain('sparkit');
  });

  it('returns a shortage message without changing state when the tame item is missing', () => {
    const save = createDefaultSaveState('budfox');
    const untamed = clonePetForPlayer('cloudlet', 4);
    const result = attemptTame(
      {
        ...save,
        inventory: { ...save.inventory, 'resonance-mark': 0 }
      },
      untamed,
      'resonance-mark'
    );

    expect(result.success).toBe(false);
    expect(result.consumedItem).toBe(false);
    expect(result.message).toContain('道具不足');
  });
});
