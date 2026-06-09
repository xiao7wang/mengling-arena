import { getExperienceToNextLevel, getPetSpecies, getStatsAtLevel } from '../data/pets';
import type { PetInstance } from '../types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function feedPet(pet: PetInstance, intimacyGain: number): PetInstance {
  return {
    ...pet,
    intimacy: clamp(pet.intimacy + intimacyGain, 0, 100)
  };
}

export function gainExperience(pet: PetInstance, amount: number): PetInstance {
  const species = getPetSpecies(pet.speciesId);
  let level = pet.level;
  let experience = pet.experience + Math.max(0, amount);
  let leveledUp = false;

  while (experience >= getExperienceToNextLevel(level)) {
    experience -= getExperienceToNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  const stats = getStatsAtLevel(species, level);
  return {
    ...pet,
    ...stats,
    level,
    experience,
    currentHp: leveledUp ? stats.maxHp : Math.min(pet.currentHp, stats.maxHp),
    hp: leveledUp ? stats.maxHp : Math.min(pet.currentHp, stats.maxHp)
  };
}

export function trainPet(pet: PetInstance, experienceGain: number): PetInstance {
  return gainExperience(pet, experienceGain);
}

export function healPet(pet: PetInstance, amount: number): PetInstance {
  const currentHp = clamp(pet.currentHp + amount, 0, pet.maxHp);
  return {
    ...pet,
    currentHp,
    hp: currentHp
  };
}
