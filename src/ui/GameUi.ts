import { elementLabels } from '../data/typeChart';
import { getExperienceToNextLevel } from '../data/pets';
import { getSkill } from '../data/skills';
import { statusLabels } from '../systems/battleSystem';
import { getTameChance } from '../systems/tameSystem';
import type { GameRuntime } from '../game/GameRuntime';
import type { ItemDefinition, PetInstance, PetSpecies } from '../types';

type NavTarget = 'home' | 'map' | 'battle' | 'dex' | 'bag' | 'menu';

interface NavCallbacks {
  go: (target: NavTarget) => void;
}

export class GameUi {
  constructor(private readonly root: HTMLElement) {}

  clear(): void {
    this.root.innerHTML = '';
  }

  renderMenu(options: { start: () => void; continueGame: () => void; clearSave: () => void }): void {
    this.set(`
      <section class="screen menu-screen">
        <div class="brand">
          <span class="brand-mark"></span>
          <p>原创萌灵养成对战</p>
          <h1>萌灵竞技场</h1>
        </div>
        <div class="menu-actions">
          <button data-action="continue">继续冒险</button>
          <button data-action="start">新的记录</button>
          <button data-action="clear">清除存档 / 重新开始</button>
        </div>
      </section>
    `);
    this.bind('continue', options.continueGame);
    this.bind('start', options.start);
    this.bind('clear', options.clearSave);
  }

  renderStarterSelection(
    starters: PetSpecies[],
    options: { choose: (speciesId: string) => void; clearSave: () => void }
  ): void {
    this.set(`
      <section class="screen starter-screen">
        <aside class="panel wide-panel starter-panel">
          <p class="eyebrow">初始共鸣</p>
          <h2>选择你的第一只萌灵</h2>
          <div class="starter-grid">
            ${starters
              .map(
                (species) => `
                <button class="starter-card" data-starter="${species.id}">
                  <span class="dex-dot" style="--pet-color: #${species.color
                    .toString(16)
                    .padStart(6, '0')}"></span>
                  <strong>${species.name}</strong>
                  <small>${elementLabels[species.element]}属性 · ${species.role ?? '伙伴型'}</small>
                  <p>${species.description}</p>
                </button>`
              )
              .join('')}
          </div>
          <button data-action="clear">清除存档 / 重新开始</button>
        </aside>
      </section>
    `);
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter]').forEach((button) => {
      button.addEventListener('click', () => options.choose(button.dataset.starter ?? starters[0].id));
    });
    this.bind('clear', options.clearSave);
  }

  renderHome(runtime: GameRuntime, nav: NavCallbacks, refresh: () => void): void {
    if (runtime.needsStarterSelection) {
      this.renderStarterSelection(runtime.starterOptions, {
        choose: (speciesId) => {
          runtime.chooseStarter(speciesId);
          refresh();
        },
        clearSave: () => {
          runtime.newGame();
          refresh();
        }
      });
      return;
    }

    const active = runtime.activePet;
    this.set(`
      ${this.nav('home')}
      <section class="screen two-column">
        <aside class="panel">
          <p class="eyebrow">萌灵家园</p>
          <h2>${active.nickname}</h2>
          ${this.petStats(active)}
          <p class="message">${runtime.recentMessage}</p>
          <div class="action-grid">
            <button data-action="feed">喂食</button>
            <button data-action="train">训练</button>
            <button data-action="heal">治疗</button>
          </div>
        </aside>
        <aside class="panel pet-list">
          <p class="eyebrow">我的萌灵</p>
          ${runtime.save.pets
            .map(
              (pet) => `
              <button class="pet-row ${pet.id === active.id ? 'active' : ''}" data-pet="${pet.id}">
                <span>${pet.nickname}</span>
                <span>Lv.${pet.level} · ${elementLabels[pet.element]}</span>
              </button>`
            )
            .join('')}
        </aside>
      </section>
    `);
    this.bindNav(nav);
    this.bind('feed', () => {
      runtime.feedActivePet();
      refresh();
    });
    this.bind('train', () => {
      runtime.trainActivePet();
      refresh();
    });
    this.bind('heal', () => {
      runtime.healActivePet();
      refresh();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet]').forEach((button) => {
      button.addEventListener('click', () => {
        runtime.setActivePet(button.dataset.pet ?? active.id);
        refresh();
      });
    });
  }

  renderMap(runtime: GameRuntime, nav: NavCallbacks, explore: (mapId: string) => void): void {
    this.set(`
      ${this.nav('map')}
      <section class="screen map-screen">
        <aside class="panel map-panel">
          <p class="eyebrow">探索地图</p>
          <h2>${runtime.mapDefinitions.find((map) => map.id === runtime.selectedMapId)?.name}</h2>
          <p class="message">${runtime.recentMessage}</p>
          <div class="map-list">
            ${runtime.mapDefinitions
              .map(
                (map) => `
                <button class="map-row ${
                  runtime.selectedMapId === map.id ? 'active' : ''
                }" data-map="${map.id}">
                  <span>${map.name}</span>
                  <small>${map.description}</small>
                </button>`
              )
              .join('')}
          </div>
          <button class="primary" data-action="explore">开始探索</button>
        </aside>
      </section>
    `);
    this.bindNav(nav);
    this.root.querySelectorAll<HTMLButtonElement>('[data-map]').forEach((button) => {
      button.addEventListener('click', () => {
        runtime.selectedMapId = button.dataset.map ?? runtime.selectedMapId;
        this.renderMap(runtime, nav, explore);
      });
    });
    this.bind('explore', () => explore(runtime.selectedMapId));
  }

  renderBattle(runtime: GameRuntime, nav: NavCallbacks, refresh: () => void): void {
    const battle = runtime.currentBattle;
    if (!battle) {
      this.set(`
        ${this.nav('battle')}
        <section class="screen battle-ui">
          <aside class="panel">
            <p class="eyebrow">回合制战斗</p>
            <h2>没有正在进行的战斗</h2>
            <p class="message">${runtime.recentMessage}</p>
            <div class="action-grid">
              <button data-nav="home">返回家园</button>
              <button data-nav="map">继续探索</button>
            </div>
          </aside>
        </section>
      `);
      this.bindNav(nav);
      return;
    }

    const active = battle.player;
    const enemy = battle.enemy;
    const selectedItem = runtime.tameItems.find((item) => item.id === runtime.selectedTameItemId);
    const tameChance = selectedItem ? getTameChance(enemy, selectedItem.id).chance : 0;
    this.set(`
      ${this.nav('battle')}
      <section class="screen battle-ui">
        <aside class="panel command-panel">
          <p class="eyebrow">我方萌灵</p>
          <h2>${active.nickname}</h2>
          ${this.petStats(active)}
          <p class="eyebrow">契约道具</p>
          <div class="tame-row">
            ${runtime.tameItems
              .map(
                (item) =>
                  `<button class="${
                    item.id === runtime.selectedTameItemId ? 'active' : ''
                  }" data-tame-item="${item.id}">${item.name} x${runtime.save.inventory[item.id] ?? 0}</button>`
              )
              .join('')}
          </div>
          <p class="message">当前驯服成功率：${Math.round(tameChance * 100)}%</p>
          ${this.battleCommands(runtime, active)}
        </aside>
        <aside class="panel log-panel">
          <p class="eyebrow">未驯服萌灵</p>
          <h2>${enemy.nickname}</h2>
          ${this.petStats(enemy)}
          <ol class="battle-log">
            ${battle.log
              .slice(-9)
              .map((line) => `<li>${line}</li>`)
              .join('')}
          </ol>
        </aside>
      </section>
    `);
    this.bindNav(nav);
    this.root.querySelectorAll<HTMLButtonElement>('[data-tame-item]').forEach((button) => {
      button.addEventListener('click', () => {
        runtime.setSelectedTameItem(button.dataset.tameItem ?? runtime.selectedTameItemId);
        refresh();
      });
    });
    if (battle.status === 'active') {
      this.bind('basic-attack', () => {
        runtime.performBasicAttack();
        refresh();
      });
      this.bind('skill-attack', () => {
        runtime.performPlayerSkill(active.skillIds[0]);
        refresh();
      });
      this.bind('soothe', () => {
        runtime.sootheUntamed();
        refresh();
      });
      this.bind('tame', () => {
        runtime.tryTame();
        refresh();
      });
      this.bind('flee', () => {
        runtime.runAway();
        refresh();
      });
    }
  }

  renderDex(runtime: GameRuntime, nav: NavCallbacks): void {
    this.set(`
      ${this.nav('dex')}
      <section class="screen dex-screen">
        <aside class="panel wide-panel">
          <p class="eyebrow">萌灵图鉴</p>
          <h2>${runtime.save.discoveredSpecies.length}/${runtime.allSpecies.length} 已发现</h2>
          <div class="dex-grid">
            ${runtime.allSpecies
              .map((species) => {
                const discovered = runtime.save.discoveredSpecies.includes(species.id);
                return `
                <article class="dex-entry ${discovered ? '' : 'locked'}">
                  <span class="dex-dot" style="--pet-color: #${species.color
                    .toString(16)
                    .padStart(6, '0')}"></span>
                  <h3>${discovered ? species.name : '未知萌灵'}</h3>
                  <p>${discovered ? species.description : '继续探索地图，发现新的伙伴。'}</p>
                  <small>${discovered ? `${elementLabels[species.element]} · ${species.rarity}` : '???'}</small>
                </article>`;
              })
              .join('')}
          </div>
        </aside>
      </section>
    `);
    this.bindNav(nav);
  }

  renderBag(runtime: GameRuntime, nav: NavCallbacks, refresh: () => void): void {
    this.set(`
      ${this.nav('bag')}
      <section class="screen bag-screen">
        <aside class="panel wide-panel">
          <p class="eyebrow">背包</p>
          <h2>${runtime.save.coins} 星币</h2>
          <p class="message">${runtime.recentMessage}</p>
          <div class="item-grid">
            ${runtime.itemDefinitions.map((item) => this.itemEntry(item, runtime)).join('')}
          </div>
          <button data-action="restart">清除存档 / 重新开始</button>
        </aside>
      </section>
    `);
    this.bindNav(nav);
    this.bind('use-meling-snack', () => {
      runtime.feedActivePet('meling-snack');
      refresh();
    });
    this.bind('use-focus-card', () => {
      runtime.trainActivePet('focus-card');
      refresh();
    });
    this.bind('use-dew-tonic', () => {
      runtime.healActivePet('dew-tonic');
      refresh();
    });
    this.bind('restart', () => {
      runtime.newGame();
      nav.go('menu');
    });
  }

  private itemEntry(item: ItemDefinition, runtime: GameRuntime): string {
    const count = runtime.save.inventory[item.id] ?? 0;
    const canUse = ['meling-snack', 'focus-card', 'dew-tonic'].includes(item.id);
    return `
      <article class="item-entry">
        <span>${item.name}</span>
        <small>${item.description}</small>
        <strong>x${count}</strong>
        ${canUse ? `<button data-action="use-${item.id}" ${count <= 0 ? 'disabled' : ''}>使用</button>` : ''}
      </article>
    `;
  }

  private battleCommands(runtime: GameRuntime, active: PetInstance): string {
    if (runtime.currentBattle?.status !== 'active') {
      return '<button class="primary" data-nav="map">继续探索</button>';
    }
    const skill = getSkill(active.skillIds[0]);
    return `
      <div class="action-grid">
        <button data-action="basic-attack">普通攻击</button>
        <button data-action="skill-attack">技能攻击：${skill.name}</button>
        <button data-action="soothe">安抚</button>
        <button data-action="tame">尝试驯服</button>
        <button data-action="flee">逃跑</button>
      </div>
    `;
  }

  private petStats(pet: PetInstance): string {
    return `
      <dl class="stats">
        <div><dt>属性</dt><dd>${elementLabels[pet.element]}</dd></div>
        <div><dt>等级</dt><dd>${pet.level}</dd></div>
        <div><dt>经验</dt><dd>${pet.experience}/${getExperienceToNextLevel(pet.level)}</dd></div>
        <div><dt>亲密</dt><dd>${pet.intimacy}</dd></div>
        <div><dt>生命</dt><dd>${pet.currentHp}/${pet.maxHp}</dd></div>
        <div><dt>攻击</dt><dd>${pet.attack}</dd></div>
        <div><dt>防御</dt><dd>${pet.defense}</dd></div>
        <div><dt>速度</dt><dd>${pet.speed}</dd></div>
      </dl>
      <div class="status-list">
        ${
          pet.statusEffects.length
            ? pet.statusEffects.map((status) => `<span>${statusLabels[status]}</span>`).join('')
            : '<span>状态稳定</span>'
        }
      </div>
    `;
  }

  private nav(active: NavTarget): string {
    const entries: Array<[NavTarget, string]> = [
      ['menu', '主菜单'],
      ['home', '家园'],
      ['map', '地图'],
      ['battle', '战斗'],
      ['dex', '图鉴'],
      ['bag', '背包']
    ];
    return `
      <nav class="top-nav">
        ${entries
          .map(
            ([target, label]) =>
              `<button class="${target === active ? 'active' : ''}" data-nav="${target}">${label}</button>`
          )
          .join('')}
      </nav>
    `;
  }

  private bindNav(nav: NavCallbacks): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((button) => {
      button.addEventListener('click', () => nav.go((button.dataset.nav ?? 'home') as NavTarget));
    });
  }

  private bind(action: string, callback: () => void): void {
    this.root.querySelectorAll<HTMLElement>(`[data-action="${action}"]`).forEach((element) => {
      element.addEventListener('click', callback);
    });
  }

  private set(html: string): void {
    this.root.innerHTML = html;
  }
}
