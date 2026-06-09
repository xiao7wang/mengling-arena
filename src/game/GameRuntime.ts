import { getItem, items } from '../data/items';
import { maps, pickEncounter } from '../data/maps';
import { clonePetForPlayer, petSpecies, getPetSpecies } from '../data/pets';
import { createBattleState, performBattleTurn, type BattleState } from '../systems/battleSystem';
import { attemptCapture } from '../systems/captureSystem';
import { consumeItem } from '../systems/inventorySystem';
import { feedPet, gainExperience, healPet, trainPet } from '../systems/growthSystem';
import { clearSave, loadGame, saveGame } from '../systems/saveSystem';
import type { PetInstance, SaveState } from '../types';

export class GameRuntime {
  save: SaveState = loadGame();
  selectedMapId = maps[0].id;
  currentBattle?: BattleState;
  recentMessage = '欢迎来到萌灵竞技场。';

  get activePet(): PetInstance {
    const active = this.save.pets.find((pet) => pet.id === this.save.activePetId);
    if (active) {
      return active;
    }
    const fallback = this.save.pets[0];
    this.save.activePetId = fallback.id;
    return fallback;
  }

  get allSpecies() {
    return petSpecies;
  }

  get itemDefinitions() {
    return items;
  }

  get mapDefinitions() {
    return maps;
  }

  newGame(): void {
    this.save = clearSave();
    this.currentBattle = undefined;
    this.selectedMapId = maps[0].id;
    this.recentMessage = '新的训练记录已经开始。';
    this.persist();
  }

  persist(): void {
    saveGame(this.save);
  }

  setActivePet(petId: string): void {
    if (!this.save.pets.some((pet) => pet.id === petId)) {
      return;
    }
    this.save = {
      ...this.save,
      activePetId: petId
    };
    this.recentMessage = '已更换出战萌灵。';
    this.persist();
  }

  replacePet(updatedPet: PetInstance): void {
    this.save = {
      ...this.save,
      pets: this.save.pets.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet))
    };
    this.persist();
  }

  feedActivePet(itemId = 'berry-cake'): void {
    const item = getItem(itemId);
    const consumed = consumeItem(this.save.inventory, itemId);
    if (!consumed.ok || !item.intimacyGain) {
      this.recentMessage = `${item.name} 不足。`;
      return;
    }
    const fed = feedPet(this.activePet, item.intimacyGain);
    this.save = {
      ...this.save,
      inventory: consumed.inventory,
      pets: this.save.pets.map((pet) => (pet.id === fed.id ? fed : pet))
    };
    this.recentMessage = `${fed.nickname} 亲密度提升到 ${fed.intimacy}。`;
    this.persist();
  }

  trainActivePet(itemId = 'focus-card'): void {
    const item = getItem(itemId);
    const consumed = consumeItem(this.save.inventory, itemId);
    if (!consumed.ok || !item.trainingExp) {
      this.recentMessage = `${item.name} 不足。`;
      return;
    }
    const before = this.activePet;
    const trained = trainPet(before, item.trainingExp);
    this.save = {
      ...this.save,
      inventory: consumed.inventory,
      pets: this.save.pets.map((pet) => (pet.id === trained.id ? trained : pet))
    };
    this.recentMessage =
      trained.level > before.level
        ? `${trained.nickname} 升到了 Lv.${trained.level}。`
        : `${trained.nickname} 获得了 ${item.trainingExp} 点经验。`;
    this.persist();
  }

  healActivePet(itemId = 'dew-tonic'): void {
    const item = getItem(itemId);
    const consumed = consumeItem(this.save.inventory, itemId);
    if (!consumed.ok || !item.healAmount) {
      this.recentMessage = `${item.name} 不足。`;
      return;
    }
    const healed = healPet(this.activePet, item.healAmount);
    this.save = {
      ...this.save,
      inventory: consumed.inventory,
      pets: this.save.pets.map((pet) => (pet.id === healed.id ? healed : pet))
    };
    this.recentMessage = `${healed.nickname} 的生命恢复到 ${healed.currentHp}/${healed.maxHp}。`;
    this.persist();
  }

  startEncounter(mapId = this.selectedMapId): void {
    this.selectedMapId = mapId;
    const encounter = pickEncounter(mapId);
    const wildPet = clonePetForPlayer(encounter.speciesId, encounter.level);
    this.currentBattle = createBattleState(this.activePet, wildPet);
    this.save = {
      ...this.save,
      visitedMaps: Array.from(new Set([...this.save.visitedMaps, mapId])),
      discoveredSpecies: Array.from(new Set([...this.save.discoveredSpecies, wildPet.speciesId]))
    };
    this.recentMessage = `在 ${maps.find((map) => map.id === mapId)?.name ?? '野外'} 遇到了 ${
      wildPet.nickname
    }。`;
    this.persist();
  }

  performPlayerSkill(skillId: string): void {
    if (!this.currentBattle || this.currentBattle.status !== 'active') {
      return;
    }
    const enemySkillId = this.currentBattle.enemy.skillIds[0];
    const result = performBattleTurn(this.currentBattle, skillId, enemySkillId);
    this.currentBattle = result;

    let activePet = result.player;
    const updates: Partial<SaveState> = {
      discoveredSpecies: Array.from(
        new Set([...this.save.discoveredSpecies, result.enemy.speciesId])
      )
    };

    if (result.status === 'won') {
      const exp = 80 + result.enemy.level * 24;
      const coins = 35 + result.enemy.level * 8;
      activePet = gainExperience(result.player, exp);
      this.currentBattle = {
        ...result,
        player: activePet,
        log: [...result.log, `${activePet.nickname} 获得 ${exp} 经验和 ${coins} 星币。`]
      };
      updates.coins = this.save.coins + coins;
      this.recentMessage = `胜利！获得 ${coins} 星币。`;
    } else if (result.status === 'lost') {
      activePet = { ...result.player, currentHp: 1 };
      this.currentBattle = {
        ...result,
        player: activePet,
        log: [...result.log, `${activePet.nickname} 被带回家园休息。`]
      };
      this.recentMessage = '战斗失利，萌灵回到家园休息。';
    } else {
      this.recentMessage = '回合结束。';
    }

    this.save = {
      ...this.save,
      ...updates,
      pets: this.save.pets.map((pet) => (pet.id === activePet.id ? activePet : pet))
    };
    this.persist();
  }

  tryCapture(itemId: string): void {
    if (!this.currentBattle || this.currentBattle.status !== 'active') {
      return;
    }
    const result = attemptCapture(this.save, this.currentBattle.enemy, itemId);
    this.save = result.state;
    this.currentBattle = {
      ...this.currentBattle,
      log: [...this.currentBattle.log, result.message]
    };
    this.recentMessage = result.message;
    if (result.success) {
      this.currentBattle = undefined;
    }
    this.persist();
  }

  getActiveSpeciesName(): string {
    return getPetSpecies(this.activePet.speciesId).name;
  }
}

export const runtime = new GameRuntime();
