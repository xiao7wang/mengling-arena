import Phaser from 'phaser';
import { drawPet, drawSoftBackground } from '../game/draw';
import { runtime } from '../game/GameRuntime';
import type { GameUi } from '../ui/GameUi';

export class BagScene extends Phaser.Scene {
  constructor(private readonly ui: GameUi) {
    super('BagScene');
  }

  create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll();
    drawSoftBackground(this, 0x45415d);
    drawPet(this, runtime.activePet, this.scale.width * 0.28, this.scale.height * 0.5, Math.min(this.scale.width, this.scale.height) * 0.11);
    this.ui.renderBag(
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
    this.scene.start(sceneMap[target] ?? 'BagScene');
  }
}
