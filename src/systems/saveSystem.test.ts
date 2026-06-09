import { describe, expect, it } from 'vitest';
import { chooseStarter, createDefaultSaveState, loadGame, saveGame } from './saveSystem';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('saveSystem', () => {
  it('persists and loads save state through localStorage-compatible storage', () => {
    const storage = new MemoryStorage();
    const state = createDefaultSaveState('budfox');
    state.coins = 99;

    saveGame(state, storage);
    const loaded = loadGame(storage);

    expect(loaded.coins).toBe(99);
    expect(loaded.pets.length).toBe(state.pets.length);
  });

  it('starts without a chosen starter and then stores the selected starter', () => {
    const state = createDefaultSaveState();

    expect(state.hasChosenStarter).toBe(false);
    expect(state.pets).toHaveLength(0);

    const chosen = chooseStarter(state, 'cinderkit');

    expect(chosen.hasChosenStarter).toBe(true);
    expect(chosen.pets[0].speciesId).toBe('cinderkit');
    expect(chosen.activePetId).toBe(chosen.pets[0].id);
    expect(chosen.inventory['soothe-bell']).toBe(5);
    expect(chosen.inventory['meling-snack']).toBe(5);
    expect(chosen.inventory['spirit-stone']).toBe(2);
  });
});
