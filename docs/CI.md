# Kraft Work 持续集成

`Kraft Work CI` 检查当前源码、构建独立的官方 UI 与 Framework Host，并保留短期构建产物。它没有发布步骤，不创建 Tag，不更新公开 Release。

## 触发与环境

- 发往 `main` 的 Pull Request。
- 推送到 `main` 或 `ci/kraft-work-*` 分支。
- Actions 页手动运行。

首轮采用一个 Ubuntu job、Node.js 22、Python 3.12 和 lockfile 对应的 Playwright Chromium。job 上限 15 分钟，同一 PR 或分支的新运行会取消旧运行。Actions 固定到提交 SHA，仓库权限为只读，不使用发布凭据。Windows 本地浏览器检查继续使用已安装的 Edge。

不监听 Tag。暂不增加所有 Node 版本或平台矩阵；先根据每项耗时和实际失败调整范围。

## 检查内容

| 入口 | 检查范围 |
| --- | --- |
| `npm run ci:check` | render-state 字段、UI／Adapter／early TypeScript 与 Framework 合同类型 |
| `npm run ci:unit` | 偏好、版本边界、衣柜投影／槽位／容量／原生操作参数、渲染状态与已退役实验入口 |
| `npm run ci:build` | 复用 Framework 构建，包括合同测试所需样例；只打包玩家需要的 UI 与 Host ZIP |
| `npm run ci:packages` | ZIP 成员与路径、CRC、Mod 身份、加载入口、依赖、Twee 替换声明、源码／构建成员一致性、许可证与依赖 NOTICE；损坏包负例 |
| `npm run ci:browser` | Host／消费者独立性与释放、真实设置组件的双布局／滚动／输入阻挡、衣柜详情抽屉、商店事件、存档传输恢复、天气／页面动效、CE 原作者与 rebuild.30 的受控兼容合同 |

浏览器用例运行仓库自有夹具和实际模块，不下载游戏或社区 Mod，不读取 `tests/fixture.html`、私人存档或设备数据。CE 版本由夹具提供，不能据此宣称在真实 ModLoader 中完成了该组合验收。设置用例直接运行实际 controller 和 Vue 组件；它不替代真实游戏中的业务检查。

现有 `framework-commands.cjs` 的无 SugarCube 夹具会明确调用 `sceneReady()`，并先断言未接桥时绑定仍不可用。测试不会放宽 Host 的场景就绪要求。

## 本地执行

在仓库根目录运行：

```text
npm ci
npm run ci:check
npm run ci:unit
npm run ci:build
npm run ci:packages
npm run ci:browser
```

Linux 首次运行浏览器检查前执行 `npx playwright install --with-deps chromium`。Windows 使用已安装的 Edge。不要用经典 `npm test`／`npm run package` 代替以上 3.0 入口；经典打包仍服务其保留路径。

## 产物与失败记录

全部检查通过后上传 `kraft-work-build-<SHA>`，保存 7 天，包含：

- `DoLGameUI-3.0.0.mod.zip`
- `StoneFreeHost-0.1.4-experimental.mod.zip`
- `PACKAGE_CHECKS.json`：实际提交、工作区状态、依赖和每个 ZIP 成员的 SHA-256。
- `SHA256SUMS.txt`：上述三个负载的 SHA-256，校验清单自身除外。

这些是当前提交的 CI 构建，不是已发布冻结包。文档或构建环境不同可能改变 ZIP 摘要，CI 不据此替换公开附件。

无论成功或失败，已生成的受控测试日志会上传为 `kraft-work-checks-<SHA>`，保存 7 天。`tests/artifacts/ci/` 包含逐项日志、状态、耗时和平台，Actions summary 也显示耗时。测试不自动重试；一项失败后，其余同组用例标为 `not-run`。先诊断失败再修复，不通过删断言或反复重跑至绿来收口。

## 验证边界

CI 不代表真实 DoL、Android WebView、物理触控或 Visual Gate 验收。真实回合结算、购买、存读档、社区组合、长期资源观察及真实设备检查沿用项目的独立验收流程。依赖外部游戏源码／Tweego 的历史夹具不纳入此 job。

此配置不修改分支保护，也不自动合并 PR。是否设置必需检查，待首轮运行时间和稳定性确认后决定。
