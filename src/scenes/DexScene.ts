import Phaser from 'phaser';
import { petSpecies } from '../data/pets';
import { drawSoftBackground } from '../game/draw';
import { runtime } from '../game/GameRuntime';
import type { GameUi } from '../ui/GameUi';

export class DexScene extends Phaser.Scene {
  constructor(private readonly ui: GameUi) {
    super('DexScene');
  }

  create(): void {
    if (runtime.needsStarterSelection) {
      this.scene.start('MainMenuScene');
      return;
    }
    drawSoftBackground(this, 0x29395a);
    const width = this.scale.width;
    const height = this.scale.height;
    petSpecies.forEach((species, index) => {
      const discovered = runtime.save.discoveredSpecies.includes(species.id);
      const x = width * (0.18 + (index % 3) * 0.18);
      const y = height * (0.32 + Math.floor(index / 3) * 0.22);
      this.add.circle(x, y, 36, discovered ? species.color : 0x718096, discovered ? 0.95 : 0.42);
      this.add.text(x, y + 58, discovered ? species.name : '???', {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: '15px',
        color: '#f8fafc'
      }).setOrigin(0.5);
    });
    this.ui.renderDex(runtime, { go: (target) => this.go(target) });
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
    this.scene.start(sceneMap[target] ?? 'DexScene');
  }
}
