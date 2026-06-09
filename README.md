# 萌灵竞技场

一个原创 2D 网页宠物收集、养成、捕捉、回合制对战原型。技术栈为 Vite + TypeScript + Phaser 3，第一版使用彩色圆形和简单图形作为占位美术。

## 运行

```bash
npm install
npm run dev
```

开发服务器启动后，打开终端里显示的本地地址，通常是 `http://localhost:5173`。

## 验证

```bash
npm test
npm run build
```

## 结构

- `src/data`：宠物、技能、道具、地图、属性克制表。
- `src/systems`：战斗、捕捉、养成、存档、背包等纯规则模块。
- `src/scenes`：Phaser 页面场景。
- `src/ui`：DOM 覆盖层 UI。
