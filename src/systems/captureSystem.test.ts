import { describe, expect, it } from 'vitest';
import { attemptCapture, getCaptureChance } from './captureSystem';
import { clonePetForPlayer } from '../data/pets';
import { createDefaultSaveState } from './saveSystem';

describe('captureSystem', () => {
  it('increases capture chance as wild pet hp gets lower', () => {
    const wild = clonePetForPlayer('mossbun', 4);
    const fullHpChance = getCaptureChance({ ...wild, currentHp: wild.maxHp }, 'basic-orb');
    const lowHpChance = getCaptureChance({ ...wild, currentHp: 1 }, 'basic-orb');

    expect(lowHpChance).toBeGreaterThan(fullHpChance);
  });

  it('adds a captured wild pet to the player collection and consumes one orb', () => {
    const save = createDefaultSaveState();
    const wild = clonePetForPlayer('sparkit', 3);
    wild.currentHp = 1;

    const result = attemptCapture(save, wild, 'basic-orb', {
      random: () => 0
    });

    expect(result.success).toBe(true);
    expect(result.state.pets.some((pet) => pet.speciesId === 'sparkit')).toBe(true);
    expect(result.state.inventory['basic-orb']).toBe(save.inventory['basic-orb'] - 1);
  });
});
