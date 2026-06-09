import { clonePetForPlayer } from '../data/pets';
import type { SaveState } from '../types';

export const SAVE_KEY = 'mengling-arena-save-v1';

function nowIso(): string {
  return new Date().toISOString();
}

export function createDefaultSaveState(): SaveState {
  const starter = clonePetForPlayer('budfox', 5);
  return {
    playerName: '训练师',
    coins: 300,
    pets: [starter],
    activePetId: starter.id,
    inventory: {
      'basic-orb': 5,
      'gleam-orb': 1,
      'berry-cake': 4,
      'focus-card': 3,
      'dew-tonic': 2
    },
    discoveredSpecies: ['budfox'],
    visitedMaps: ['whisper-woods'],
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
    if (!parsed.pets?.length || !parsed.activePetId) {
      return createDefaultSaveState();
    }
    return parsed;
  } catch {
    return createDefaultSaveState();
  }
}

export function clearSave(storage?: Storage): SaveState {
  const target = getStorage(storage);
  target?.removeItem(SAVE_KEY);
  return createDefaultSaveState();
}
