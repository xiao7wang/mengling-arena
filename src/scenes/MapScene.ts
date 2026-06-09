import Phaser from 'phaser';
import { maps } from '../data/maps';
import { drawSoftBackground } from '../game/draw';
import { runtime } from '../game/GameRuntime';
import type { GameUi } from '../ui/GameUi';

export class MapScene extends Phaser.Scene {
  constructor(private readonly ui: GameUi) {
    super('MapScene');
  }

  create(): void {
    if (runtime.needsStarterSelection) {
      this.scene.start('MainMenuScene');
      return;
    }
    this.render();
  }

  private render(): void {
    this.children.removeAll();
    const selected = maps.find((map) => map.id === runtime.selectedMapId) ?? maps[0];
    drawSoftBackground(this, selected.color);
    const width = this.scale.width;
    const height = this.scale.height;
    maps.forEach((map, index) => {
      const x = width * (0.24 + index * 0.2);
      const y = height * (0.46 + Math.sin(index) * 0.1);
      const active = map.id === runtime.selectedMapId;
      this.add.circle(x, y, active ? 58 : 46, map.color, active ? 1 : 0.72);
      this.add.circle(x, y, active ? 70 : 56, 0xffffff, active ? 0.16 : 0.08);
      this.add.text(x, y + 80, map.name, {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: '16px',
        color: '#f8fafc'
      }).setOrigin(0.5);
    });

    this.ui.renderMap(
      runtime,
      { go: (target) => this.go(target) },
      (mapId) => {
        runtime.startEncounter(mapId);
        this.scene.start('BattleScene');
      }
    );
  }

  private go(target: string): void {
    const sceneMap: Record<string, string> = {
      menu: 'MainMenuScene',
      home: 'HomeScene',
      map: 'MapScene',
      battle: 'BattleScene',
      dex: 'DexScene',
      bag: 'BagScene'
    };
    this.scene.start(sceneMap[target] ?? 'MapScene');
  }
}
