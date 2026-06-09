import { getItem, items } from '../data/items';
import { maps } from '../data/maps';
import {
  clonePetForPlayer,
  getPetSpecies,
  petSpecies,
  pickRandomPetSpecies,
  starterSpecies
} from '../data/pets';
import {
  addStatusEffect,
  createBattleState,
  performBasicAttackTurn,
  performEnemyCounterTurn,
  performPlayerSkillTurn,
  type BattleState
} from '../systems/battleSystem';
import { consumeItem } from '../systems/inventorySystem';
import { feedPet, gainExperience, healPet, trainPet } from '../systems/growthSystem';
import { clearSave, chooseStarter, loadGame, saveGame } from '../systems/saveSystem';
import { attemptTame } from '../systems/tameSystem';
import type { PetInstance, SaveState } from '../types';

export class GameRuntime {
  save: SaveState = loadGame();
  selectedMapId = maps[0].id;
  selectedTameItemId = 'spirit-stone';
  currentBattle?: BattleState;
  recentMessage = '欢迎来到萌灵竞技场。';

  get needsStarterSelection(): boolean {
    return !this.save.hasChosenStarter || this.save.pets.length === 0;
  }

  get activePet(): PetInstance {
    const active = this.save.pets.find((pet) => pet.id === this.save.activePetId);
    if (active) {
      return active;
    }
    const fallback = this.save.pets[0];
    if (!fallback) {
      throw new Error('Starter has not been selected yet.');
    }
    this.save.activePetId = fallback.id;
    return fallback;
  }

  get allSpecies() {
    return petSpecies;
  }

  get starterOptions() {
    return starterSpecies;
  }

  get itemDefinitions() {
    return items;
  }

  get mapDefinitions() {
    return maps;
  }

  get tameItems() {
    return items.filter((item) => item.category === 'tame');
  }

  newGame(): void {
    this.save = clearSave();
    this.currentBattle = undefined;
    this.selectedMapId = maps[0].id;
    this.selectedTameItemId = 'spirit-stone';
    this.recentMessage = '新的记录已经开始，请选择你的初始萌灵。';
    this.persist();
  }

  chooseStarter(speciesId: string): void {
    this.save = chooseStarter(this.save, speciesId);
    this.currentBattle = undefined;
    this.recentMessage = `${this.activePet.nickname} 与你建立了第一份共鸣。`;
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

  setSelectedTameItem(itemId: string): void {
    if (!this.tameItems.some((item) => item.id === itemId)) {
      return;
    }
    this.selectedTameItemId = itemId;
  }

  feedActivePet(itemId = 'meling-snack'): void {
    if (this.needsStarterSelection) {
      return;
    }
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
    if (this.needsStarterSelection) {
      return;
    }
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
    if (this.needsStarterSelection) {
      return;
    }
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
    if (this.needsStarterSelection) {
      this.recentMessage = '请先选择初始萌灵。';
      return;
    }
    this.selectedMapId = mapId;
    const species = pickRandomPetSpecies();
    const level = 2 + Math.floor(Math.random() * 5);
    const untamedPet = clonePetForPlayer(species.id, level);
    this.currentBattle = createBattleState(this.activePet, untamedPet);
    this.save = {
      ...this.save,
      visitedMaps: Array.from(new Set([...this.save.visitedMaps, mapId])),
      discoveredSpecies: Array.from(new Set([...this.save.discoveredSpecies, untamedPet.speciesId]))
    };
    this.recentMessage = `在 ${maps.find((map) => map.id === mapId)?.name ?? '探索区域'} 遇到了未驯服萌灵 ${
      untamedPet.nickname
    }。`;
    this.persist();
  }

  performBasicAttack(): void {
    if (!this.currentBattle || this.currentBattle.status !== 'active') {
      return;
    }
    this.applyBattleResult(performBasicAttackTurn(this.currentBattle));
  }

  performPlayerSkill(skillId?: string): void {
    if (!this.currentBattle || this.currentBattle.status !== 'active') {
      return;
    }
    this.applyBattleResult(
      performPlayerSkillTurn(this.currentBattle, skillId ?? this.currentBattle.player.skillIds[0])
    );
  }

  sootheUntamed(): void {
    if (!this.currentBattle || this.currentBattle.status !== 'active') {
      return;
    }
    const itemId = 'soothe-bell';
    const item = getItem(itemId);
    const consumed = consumeItem(this.save.inventory, itemId);
    if (!consumed.ok) {
      this.recentMessage = `${item.name} 道具不足，无法安抚。`;
      this.currentBattle = {
        ...this.currentBattle,
        log: [...this.currentBattle.log, this.recentMessage]
      };
      return;
    }

    const enemy = addStatusEffect(this.currentBattle.enemy, 'affinity');
    this.save = {
      ...this.save,
      inventory: consumed.inventory
    };
    const soothedBattle = {
      ...this.currentBattle,
      enemy,
      log: [...this.currentBattle.log, `${item.name} 发出轻响，${enemy.nickname} 进入亲和状态。`]
    };
    this.applyBattleResult(performEnemyCounterTurn(soothedBattle, `${enemy.nickname} 仍保持警觉。`));
  }

  tryTame(itemId = this.selectedTameItemId): void {
    if (!this.currentBattle || this.currentBattle.status !== 'active') {
      return;
    }
    const result = attemptTame(this.save, this.currentBattle.enemy, itemId);
    this.save = result.state;
    this.recentMessage = result.message;

    if (!result.consumedItem) {
      this.currentBattle = {
        ...this.currentBattle,
        enemy: result.untamedPet,
        log: [...this.currentBattle.log, result.message]
      };
      return;
    }

    if (result.success) {
      this.currentBattle = undefined;
      this.persist();
      return;
    }

    const failedBattle = {
      ...this.currentBattle,
      enemy: result.untamedPet,
      log: [...this.currentBattle.log, result.message]
    };
    this.applyBattleResult(performEnemyCounterTurn(failedBattle, `${result.untamedPet.nickname} 立刻反击。`));
  }

  runAway(): void {
    if (!this.currentBattle) {
      return;
    }
    this.recentMessage = '你带着萌灵撤离了探索区域。';
    this.currentBattle = undefined;
    this.persist();
  }

  getActiveSpeciesName(): string {
    return getPetSpecies(this.activePet.speciesId).name;
  }

  private applyBattleResult(result: BattleState): void {
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
      this.recentMessage = `战斗结束，获得 ${coins} 星币。`;
    } else if (result.status === 'lost') {
      activePet = { ...result.player, currentHp: 1, hp: 1 };
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
}

export const runtime = new GameRuntime();
