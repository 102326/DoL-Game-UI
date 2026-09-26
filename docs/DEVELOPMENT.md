# 开发与测试

## 独立构建

Node.js 22.12+、Python 3.10+。运行 `npm ci`，然后 `npm run build`、`npm test`、`npm run package`。输出在本仓库的 `dist/` 中，无需父工程。`private: true` 仅禁止误发 npm，不限制 GitHub 源码和 ZIP 发布。

`npm test` 运行不需要游戏资源的状态接口、衣柜数据、性能采样器和绘图状态复制检查。CI 验证这些检查及构建打包，不等于完整游戏回归。

## 游戏集成测试

集成测试使用 Playwright，当前脚本配置为本机已安装的 Microsoft Edge（`channel: 'msedge'`）。先自行安装 Edge；需要生成夹具时还需 Tweego 和固定版本原版源码。

| 变量 | 用途 |
| --- | --- |
| `DOL_UPSTREAM_SOURCE` | 原版源码 checkout，提交必须为 `41993d3f32476f0b1c8db730c159a50ffcdc2a65` |
| `TWEEGO_BIN` | Tweego 可执行文件；默认尝试原版源码中的 Windows x64 工具 |
| `DOL_TEST_WORKSPACE` | 集成游戏资源根目录，布局见下方；未设置时沿用开发工作区的父目录约定 |
| `DOL_WARDROBE_INTEGRATED=1` | 选用 Lyra 集成游戏；未设置时选原版 |
| `DOL_RELEASE_DIR` | 可选的额外 ZIP 输出目录 |

资源目录布局：

```text
<DOL_TEST_WORKSPACE>/
  releases/source-baseline-0.5.11.9/vanilla.html
  upstream/game-0.5.11.9/Degrees of Lewdity.html
  upstream/game-0.5.11.9/img/...
```

完整游戏与资源须自行取得，不提交到本仓库。`settings-lifecycle.test.cjs` 是旧版本比较测试，额外需要该工作区的 `releases/mods/DoLGameUI-0.5.2.mod.zip`；不属于独立默认测试。

```sh
python scripts/build-fixture.py
node tests/acceptance.cjs
node tests/unified.test.cjs
node tests/shop.test.cjs
node tests/experiments.test.cjs
node tests/wardrobe-features.test.cjs
node tests/wardrobe-operations.test.cjs
```

运行前创建 `tests/artifacts/`（用于截图和报告）。这些文件与 `tests/fixture.html` 均忽略提交。测试使用隔离新游戏/合成数据；不要将真实存档加入自动测试或公开仓库。

## 绘图来源更新

普通构建使用已提交的 `src/wardrobe/vendor/isolated-model.js`，不需要源码下载。只有重新生成派生绘图模块时才运行 `node scripts/vendor-wardrobe.cjs`；它读取 `DOL_UPSTREAM_SOURCE` 并检查提交。更新后重新生成并审查 `scripts/render-state-fields.cjs` 的字段清单，执行对应回归。不得把替换复制方式视为零风险。

来源与许可必须随派生代码保留，见根目录的 `UPSTREAM-RENDERER-*` 文件。
