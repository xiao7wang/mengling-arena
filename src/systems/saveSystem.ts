import { clonePetForPlayer } from '../data/pets';
import type { SaveState } from '../types';

export const SAVE_KEY = 'mengling-arena-save-v1';

function nowIso(): string {
  return new Date().toISOString();
}

function createDefaultInventory() {
  return {
    'soothe-bell': 5,
    'meling-snack': 5,
    'spirit-stone': 2,
    'resonance-mark': 0,
    'berry-cake': 0,
    'focus-card': 3,
    'dew-tonic': 2
  };
}

export function createDefaultSaveState(starterSpeciesId?: string): SaveState {
  const starter = starterSpeciesId ? clonePetForPlayer(starterSpeciesId, 5) : undefined;
  return {
    playerName: '训练师',
    coins: 300,
    pets: starter ? [starter] : [],
    activePetId: starter?.id ?? '',
    inventory: createDefaultInventory(),
    discoveredSpecies: starter ? [starter.speciesId] : [],
    visitedMaps: ['whisper-woods'],
    hasChosenStarter: Boolean(starter),
    lastSavedAt: nowIso()
  };
}

export function chooseStarter(state: SaveState, starterSpeciesId: string): SaveState {
  const starter = clonePetForPlayer(starterSpeciesId, 5);
  return {
    ...state,
    pets: [starter],
    activePetId: starter.id,
    inventory: {
      ...createDefaultInventory(),
      ...state.inventory,
      'soothe-bell': state.inventory['soothe-bell'] ?? 5,
      'meling-snack': state.inventory['meling-snack'] ?? 5,
      'spirit-stone': state.inventory['spirit-stone'] ?? 2,
      'resonance-mark': state.inventory['resonance-mark'] ?? 0
    },
    discoveredSpecies: Array.from(new Set([...state.discoveredSpecies, starter.speciesId])),
    hasChosenStarter: true,
    lastSavedAt: nowIso()
  };
}

function getStorage(storage?: Storage): Storage | undefined {
  if (storage) {
    return storage;
  }
  if (typeof globalThis.localStorage === 'undefined') {
    return undefined;
  }
  return globalThis.localStorage;
}

export function saveGame(state: SaveState, storage?: Storage): void {
  const target = getStorage(storage);
  if (!target) {
    return;
  }
  target.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: nowIso() }));
}

export function loadGame(storage?: Storage): SaveState {
  const target = getStorage(storage);
  if (!target) {
    return createDefaultSaveState();
  }
  const raw = target.getItem(SAVE_KEY);
  if (!raw) {
    return createDefaultSaveState();
  }
  try {
    const parsed = JSON.parse(raw) as SaveState;
    return normalizeSaveState(parsed);
  } catch {
    return createDefaultSaveState();
  }
}

function normalizeSaveState(state: SaveState): SaveState {
  const inventory = {
    ...createDefaultInventory(),
    ...state.inventory
  };
  const pets = (state.pets ?? []).map((pet) => ({
    ...pet,
    element: pet.element ?? pet.type,
    hp: pet.hp ?? pet.currentHp,
    currentHp: pet.currentHp ?? pet.hp ?? pet.maxHp,
    baseTameRate: pet.baseTameRate ?? 0.45,
    statusEffects: pet.statusEffects ?? [],
    skills: pet.skills ?? pet.skillIds,
    skillIds: pet.skillIds ?? pet.skills
  }));
  const activePetId = pets.some((pet) => pet.id === state.activePetId)
    ? state.activePetId
    : pets[0]?.id ?? '';
  const hasChosenStarter = state.hasChosenStarter ?? pets.length > 0;
  return {
    ...state,
    pets,
    activePetId,
    inventory,
    discoveredSpecies: state.discoveredSpecies ?? pets.map((pet) => pet.speciesId),
    visitedMaps: state.visitedMaps ?? ['whisper-woods'],
    hasChosenStarter,
    lastSavedAt: state.lastSavedAt ?? nowIso()
  };
}

export function clearSave(storage?: Storage): SaveState {
  const target = getStorage(storage);
  target?.removeItem(SAVE_KEY);
  return createDefaultSaveState();
}
