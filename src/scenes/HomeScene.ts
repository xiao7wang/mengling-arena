import Phaser from 'phaser';
import { drawPet, drawSoftBackground } from '../game/draw';
import { runtime } from '../game/GameRuntime';
import type { GameUi } from '../ui/GameUi';

export class HomeScene extends Phaser.Scene {
  constructor(private readonly ui: GameUi) {
    super('HomeScene');
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
    drawSoftBackground(this, 0x315f52);
    const width = this.scale.width;
    const height = this.scale.height;
    drawPet(this, runtime.activePet, width * 0.32, height * 0.48, Math.min(width, height) * 0.13);
    this.add.rectangle(width * 0.32, height * 0.78, width * 0.42, 16, 0xbde6c7, 0.36);
    this.add.text(width * 0.32, height * 0.82, 'HOME', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#e6fff0'
    }).setOrigin(0.5);

    this.ui.renderHome(
      runtime,
      { go: (target) => this.go(target) },
      () => this.render()
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
    this.scene.start(sceneMap[target] ?? 'HomeScene');
  }
}
