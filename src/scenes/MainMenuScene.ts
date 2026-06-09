import Phaser from 'phaser';
import { petSpecies } from '../data/pets';
import { drawSoftBackground } from '../game/draw';
import { runtime } from '../game/GameRuntime';
import type { GameUi } from '../ui/GameUi';

export class MainMenuScene extends Phaser.Scene {
  constructor(private readonly ui: GameUi) {
    super('MainMenuScene');
  }

  create(): void {
    drawSoftBackground(this, 0x17324a);
    const width = this.scale.width;
    const height = this.scale.height;
    petSpecies.slice(0, 6).forEach((species, index) => {
      const angle = (Math.PI * 2 * index) / 6;
      const x = width / 2 + Math.cos(angle) * Math.min(width, height) * 0.28;
      const y = height / 2 + Math.sin(angle) * Math.min(width, height) * 0.2;
      const circle = this.add.circle(x, y, 34, species.color, 0.9);
      this.tweens.add({
        targets: circle,
        y: y - 14,
        duration: 1100 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    this.add.text(width / 2, height * 0.17, '萌灵竞技场', {
      fontFamily: 'Microsoft YaHei, Arial, sans-serif',
      fontSize: `${Math.max(34, Math.min(width, height) * 0.08)}px`,
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.ui.renderMenu({
      start: () => {
        runtime.newGame();
        this.scene.start('HomeScene');
      },
      continueGame: () => this.scene.start('HomeScene')
    });
  }
}
