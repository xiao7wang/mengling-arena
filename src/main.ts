import Phaser from 'phaser';
import './styles.css';
import { GameUi } from './ui/GameUi';
import { BagScene } from './scenes/BagScene';
import { BattleScene } from './scenes/BattleScene';
import { DexScene } from './scenes/DexScene';
import { HomeScene } from './scenes/HomeScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { MapScene } from './scenes/MapScene';

const uiRoot = document.querySelector<HTMLElement>('#ui');

if (!uiRoot) {
  throw new Error('Missing #ui root');
}

const ui = new GameUi(uiRoot);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#17202a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  scene: [
    new MainMenuScene(ui),
    new HomeScene(ui),
    new MapScene(ui),
    new BattleScene(ui),
    new DexScene(ui),
    new BagScene(ui)
  ]
});
