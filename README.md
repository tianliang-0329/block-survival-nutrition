# 方块突围 V6.2

解压后双击 action-demo.html 即可离线游玩。开发时可运行 npm start。npm run build 生成 dist/action-demo.html，之后可运行 npm test。浏览器回归使用本机 Microsoft Edge，也可用 BROWSER_BIN 指定浏览器路径。

电脑使用 WASD 或方向键移动，鼠标瞄准并按住左键蓄力射箭，空格冲刺，C 打开工作台。手机拖动底部摇杆，按住拉弓会瞄准附近敌人。点击主菜单「播放背景音乐」或「开始冒险」即可开启音频。

## 本版更新

- 修复战斗键盘监听读取错误。退出剧情、暂停或工作台后，可立即用键盘移动。触屏摇杆与拉弓分别跟踪手指，松手或切换界面时清理输入。
- 主世界改用明亮草地、浅木围栏、果树和暖色村屋，配合浅绿战斗栏。下界与末地保留各自色调。
- 首领登场时，小怪和场上弹道继续保留。事先搭好的餐盘会在首领出现时开启破盾窗口。
- 艾莉丝在序章示范操作和餐盘组合，战斗中按教程进度提示移动、拉弓、拾取和冲刺。开工作台时有具体配方与缺项提示。营养例子和当下的食材、场景一起出现。

## 实际修改文件

- action-demo.html、action/game.js：可聚焦的战场、移动和触控事件、首领登场保留同场敌人。
- action/render.js、action/style.css：主世界场景和明亮界面。
- action/framework.js、action/food-knowledge.js、action/presentation.js：艾莉丝序章、战斗、工作台和首领提示。
- scripts/test-v6.mjs、reports/v6.2/results.json：新增真实键盘输入、浏览器触屏拖动和登场前后小怪保留检查，继续回归 BGM 及三章流程。

原版素材来源见 ASSETS-LICENSES.md 与 assets/minecraft/sources.json。配乐见 AUDIO.md。章节配方是游戏任务，图鉴中的饮食建议看长期搭配。
