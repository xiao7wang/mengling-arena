import Phaser from 'phaser';
import { drawHpBar, drawPet, drawSoftBackground } from '../game/draw';
import { runtime } from '../game/GameRuntime';
import type { GameUi } from '../ui/GameUi';

export class BattleScene extends Phaser.Scene {
  constructor(private readonly ui: GameUi) {
    super('BattleScene');
  }

  create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll();
    drawSoftBackground(this, 0x24324f);
    const battle = runtime.currentBattle;
    const width = this.scale.width;
    const height = this.scale.height;

    if (battle) {
      drawPet(this, battle.player, width * 0.28, height * 0.55, Math.min(width, height) * 0.11);
      drawPet(this, battle.enemy, width * 0.7, height * 0.34, Math.min(width, height) * 0.1);
      drawHpBar(this, width * 0.18, height * 0.72, width * 0.27, 16, battle.player.currentHp, battle.player.maxHp);
      drawHpBar(this, width * 0.58, height * 0.51, width * 0.25, 14, battle.enemy.currentHp, battle.enemy.maxHp);
      this.add.text(width * 0.5, height * 0.12, `TURN ${Math.max(1, battle.turn - 1)}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#dbeafe',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, height * 0.42, '没有正在进行的战斗', {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: '24px',
        color: '#f8fafc'
      }).setOrigin(0.5);
    }

    this.ui.renderBattle(
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
    this.scene.start(sceneMap[target] ?? 'BattleScene');
  }
}
