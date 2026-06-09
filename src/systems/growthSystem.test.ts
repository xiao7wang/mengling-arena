import { describe, expect, it } from 'vitest';
import { clonePetForPlayer } from '../data/pets';
import { feedPet, trainPet } from './growthSystem';

describe('growthSystem', () => {
  it('feeding increases intimacy without exceeding the cap', () => {
    const pet = clonePetForPlayer('budfox', 3);
    pet.intimacy = 98;

    const fed = feedPet(pet, 8);

    expect(fed.intimacy).toBe(100);
  });

  it('training grants experience, levels up, and grows stats', () => {
    const pet = clonePetForPlayer('budfox', 1);
    const oldMaxHp = pet.maxHp;

    const trained = trainPet(pet, 120);

    expect(trained.level).toBeGreaterThan(1);
    expect(trained.experience).toBeGreaterThanOrEqual(0);
    expect(trained.maxHp).toBeGreaterThan(oldMaxHp);
    expect(trained.currentHp).toBe(trained.maxHp);
  });
});
