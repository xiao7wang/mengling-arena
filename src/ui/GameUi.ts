import { elementLabels } from '../data/typeChart';
import { getExperienceToNextLevel } from '../data/pets';
import { getSkill } from '../data/skills';
import type { GameRuntime } from '../game/GameRuntime';
import type { ItemDefinition, PetInstance } from '../types';

type NavTarget = 'home' | 'map' | 'battle' | 'dex' | 'bag' | 'menu';

interface NavCallbacks {
  go: (target: NavTarget) => void;
}

export class GameUi {
  constructor(private readonly root: HTMLElement) {}

  clear(): void {
    this.root.innerHTML = '';
  }

  renderMenu(options: { start: () => void; continueGame: () => void }): void {
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
        </div>
      </section>
    `);
    this.bind('continue', options.continueGame);
    this.bind('start', options.start);
  }

  renderHome(runtime: GameRuntime, nav: NavCallbacks, refresh: () => void): void {
    const active = runtime.activePet;
    this.set(`
      ${this.nav('home')}
      <section class="screen two-column">
        <aside class="panel">
          <p class="eyebrow">宠物家园</p>
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
                <span>Lv.${pet.level} · ${elementLabels[pet.type]}</span>
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
            <button data-nav="map">返回地图</button>
          </aside>
        </section>
      `);
      this.bindNav(nav);
      return;
    }

    const active = battle.player;
    const enemy = battle.enemy;
    const usableCaptureItems = runtime.itemDefinitions.filter(
      (item) => item.category === 'capture' && (runtime.save.inventory[item.id] ?? 0) > 0
    );
    this.set(`
      ${this.nav('battle')}
      <section class="screen battle-ui">
        <aside class="panel command-panel">
          <p class="eyebrow">我方</p>
          <h2>${active.nickname}</h2>
          ${this.petStats(active)}
          ${this.battleCommands(runtime, active, usableCaptureItems)}
        </aside>
        <aside class="panel log-panel">
          <p class="eyebrow">战斗日志</p>
          <h2>${enemy.nickname}</h2>
          ${this.petStats(enemy)}
          <ol class="battle-log">
            ${battle.log
              .slice(-8)
              .map((line) => `<li>${line}</li>`)
              .join('')}
          </ol>
        </aside>
      </section>
    `);
    this.bindNav(nav);
    if (battle.status === 'active') {
      this.root.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach((button) => {
        button.addEventListener('click', () => {
          runtime.performPlayerSkill(button.dataset.skill ?? active.skillIds[0]);
          refresh();
        });
      });
      this.root.querySelectorAll<HTMLButtonElement>('[data-capture]').forEach((button) => {
        button.addEventListener('click', () => {
          runtime.tryCapture(button.dataset.capture ?? 'basic-orb');
          refresh();
        });
      });
    }
  }

  renderDex(runtime: GameRuntime, nav: NavCallbacks): void {
    this.set(`
      ${this.nav('dex')}
      <section class="screen dex-screen">
        <aside class="panel wide-panel">
          <p class="eyebrow">宠物图鉴</p>
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
                  <small>${discovered ? `${elementLabels[species.type]} · ${species.rarity}` : '???'}</small>
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
        </aside>
      </section>
    `);
    this.bindNav(nav);
    this.bind('use-berry-cake', () => {
      runtime.feedActivePet('berry-cake');
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
  }

  private itemEntry(item: ItemDefinition, runtime: GameRuntime): string {
    const count = runtime.save.inventory[item.id] ?? 0;
    const canUse = ['berry-cake', 'focus-card', 'dew-tonic'].includes(item.id);
    return `
      <article class="item-entry">
        <span>${item.name}</span>
        <small>${item.description}</small>
        <strong>x${count}</strong>
        ${canUse ? `<button data-action="use-${item.id}" ${count <= 0 ? 'disabled' : ''}>使用</button>` : ''}
      </article>
    `;
  }

  private battleCommands(
    runtime: GameRuntime,
    active: PetInstance,
    usableCaptureItems: ItemDefinition[]
  ): string {
    if (runtime.currentBattle?.status !== 'active') {
      return '<button class="primary" data-nav="map">返回地图</button>';
    }
    return `
      <div class="action-grid">
        ${active.skillIds
          .map((skillId) => {
            const skill = getSkill(skillId);
            return `<button data-skill="${skill.id}">${skill.name}</button>`;
          })
          .join('')}
      </div>
      <div class="capture-row">
        ${usableCaptureItems
          .map(
            (item) =>
              `<button data-capture="${item.id}">${item.name} x${runtime.save.inventory[item.id]}</button>`
          )
          .join('')}
      </div>
    `;
  }

  private petStats(pet: PetInstance): string {
    return `
      <dl class="stats">
        <div><dt>属性</dt><dd>${elementLabels[pet.type]}</dd></div>
        <div><dt>等级</dt><dd>${pet.level}</dd></div>
        <div><dt>经验</dt><dd>${pet.experience}/${getExperienceToNextLevel(pet.level)}</dd></div>
        <div><dt>亲密</dt><dd>${pet.intimacy}</dd></div>
        <div><dt>生命</dt><dd>${pet.currentHp}/${pet.maxHp}</dd></div>
        <div><dt>攻击</dt><dd>${pet.attack}</dd></div>
        <div><dt>防御</dt><dd>${pet.defense}</dd></div>
        <div><dt>速度</dt><dd>${pet.speed}</dd></div>
      </dl>
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
