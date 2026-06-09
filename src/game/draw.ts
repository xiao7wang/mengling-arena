import Phaser from 'phaser';
import type { PetInstance } from '../types';

export function drawSoftBackground(scene: Phaser.Scene, color: number): void {
  const width = scene.scale.width;
  const height = scene.scale.height;
  scene.add.rectangle(width / 2, height / 2, width, height, color);
  scene.add.circle(width * 0.16, height * 0.22, Math.min(width, height) * 0.16, 0xffffff, 0.08);
  scene.add.circle(width * 0.86, height * 0.28, Math.min(width, height) * 0.2, 0xffffff, 0.06);
  scene.add.circle(width * 0.72, height * 0.84, Math.min(width, height) * 0.24, 0xffffff, 0.06);
}

export function drawPet(scene: Phaser.Scene, pet: PetInstance, x: number, y: number, size: number): void {
  scene.add.ellipse(x, y + size * 0.68, size * 1.4, size * 0.42, 0x0d1f25, 0.22);
  scene.add.circle(x, y, size, pet.color, 0.96);
  scene.add.circle(x - size * 0.35, y - size * 0.78, size * 0.38, pet.color, 0.88);
  scene.add.circle(x + size * 0.35, y - size * 0.78, size * 0.38, pet.color, 0.88);
  scene.add.circle(x - size * 0.32, y - size * 0.1, size * 0.09, 0x111827, 1);
  scene.add.circle(x + size * 0.32, y - size * 0.1, size * 0.09, 0x111827, 1);
  scene.add.circle(x, y + size * 0.14, size * 0.1, 0xffffff, 0.75);
  scene.add.text(x, y + size * 1.15, `${pet.nickname} Lv.${pet.level}`, {
    fontFamily: 'Microsoft YaHei, Arial, sans-serif',
    color: '#f8fafc',
    fontSize: `${Math.max(13, size * 0.22)}px`,
    align: 'center'
  }).setOrigin(0.5);
}

export function drawHpBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  currentHp: number,
  maxHp: number
): void {
  const ratio = Phaser.Math.Clamp(currentHp / maxHp, 0, 1);
  scene.add.rectangle(x, y, width, height, 0x12202a, 0.9).setOrigin(0, 0.5);
  scene.add.rectangle(x + 2, y, Math.max(0, (width - 4) * ratio), height - 4, 0x73e28b, 1).setOrigin(
    0,
    0.5
  );
}
