import { describe, expect, it } from 'vitest';
import { createDefaultSaveState, loadGame, saveGame } from './saveSystem';

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
    const state = createDefaultSaveState();
    state.coins = 99;

    saveGame(state, storage);
    const loaded = loadGame(storage);

    expect(loaded.coins).toBe(99);
    expect(loaded.pets.length).toBe(state.pets.length);
  });
});
