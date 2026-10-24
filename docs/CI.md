# Kraft Work 持续集成

`Kraft Work CI` 检查当前源码、构建独立的官方 UI 与 Framework Host，并保留短期构建产物。它没有发布步骤，不创建 Tag，不更新公开 Release。

当前已完成的CI整改及跨设备入口见 [Moody Blues V1.2交接](audits/MOODY-CI-V1.2-HANDOFF.md)。PR #24已合入研发3e6e039；本文描述运行合同，具体通过结论仍须匹配实际Commit/Run/Attempt。

## 触发与环境

- 发往 `main` 或 `dev/evolution-4.0` 的 Pull Request。
- 推送到 `main`、`ci/kraft-work-*` 或 `ci/moody-blues-*` 分支。
- Actions 页手动运行。

标准验证采用 Ubuntu、Node.js 26、Python 3.12 和 lockfile 对应的 Playwright Chromium；标准与研究producer的具体超时以当前工作流配置为准，下载复核与最终门禁独立运行。PR与分支push按事件分别并发控制，main push不取消前序验证，手动运行以Run ID隔离。Actions固定到提交SHA，仓库权限为只读，不使用发布凭据。Windows本地浏览器检查继续使用已安装的Edge。

不监听 Tag。暂不增加所有 Node 版本或平台矩阵；先根据每项耗时和实际失败调整范围。

Node 26 Only的当前实施、完整Actions和制品回读见[专项报告](evolution/EVO-NODE26-ONLY-2026-10-24.md)。它不等于全量TS First或发布验收完成。

## 检查内容

| 入口 | 检查范围 |
| --- | --- |
| `npm run ci:check` | 严格CI TypeScript、源码声明生成锁的一致性、render-state字段、UI／Adapter／early TypeScript与Framework合同类型 |
| `npm run ci:unit` | 偏好、版本边界、衣柜投影／槽位／容量／原生操作参数、渲染状态、嘴部资源门槛与已退役实验入口 |
| `npm run ci:build` | 构建Framework及必要合同样例，生成当前UI、Host与六个可选兼容包的八包receipt；此入口本身不等于双构建验收 |
| `npm run ci:packages` | ZIP 成员与路径、CRC、Mod 身份、加载入口、依赖、Twee 替换声明、源码／构建成员一致性、许可证与依赖NOTICE；独立第二工作目录双构建/严格ZIP字节比较、9个Python合同测试及损坏包反例 |
| `npm run ci:browser` | Host／消费者独立性与释放、真实设置组件的双布局／滚动／输入阻挡、衣柜详情抽屉、商店事件、存档传输恢复、天气／页面动效、CE 原作者与 rebuild.30 的受控兼容合同；并包含官方默认值、原生选择器、存档视口、三页页头与四个外观包材质回归，以及唯一 3.x 视觉基线检查 |

浏览器用例运行仓库自有夹具和实际模块，不下载游戏或社区 Mod，不读取 `tests/fixture.html`、私人存档或设备数据。CE 版本由夹具提供，不能据此宣称在真实 ModLoader 中完成了该组合验收。设置用例直接运行实际 controller 和 Vue 组件；它不替代真实游戏中的业务检查。

现有 `framework-commands.cjs` 的无 SugarCube 夹具会明确调用 `sceneReady()`，并先断言未接桥时绑定仍不可用。测试不会放宽 Host 的场景就绪要求。

## 本地执行

### 项目、组件版本与构建身份

当前 Moody Blues 身份规则见 [Project / Build Identity](audits/MOODY-PROJECT-BUILD-IDENTITY.md)。`project-identity.json` 中的 Project ID 只生成一次并永久保留；UI、Core、Host 各自读取实际来源，不要求同号，也不固定产品主版本。制品仍须与本次声明和构建输入一致，Host 协议及依赖兼容合同保留。

GitHub 构建以 Project ID、Commit SHA、Run ID、Attempt 绑定证据，八包 SHA-256 通过 receipt、合同报告和上传索引溯源。本地独立执行下列 build / packages 命令时，检查器复用首轮 receipt 的本地 Run ID，并严格核对源码和完整身份；CI 不从旧 receipt 接管 Run ID。完整 stage runner 仍统一设置 `MOODY_EVIDENCE_ID`。

当前采用Node 26 Only，最低26.12.1且<27；两套工作流读取 `.node-version`，当前固定26.12.1。该版本默认支持可擦除TS；工作流保留显式 `NODE_OPTIONS=--experimental-strip-types`。`npm ci`不需要先构建CI工具，严格类型检查在依赖安装后执行。旧Node22/24及26.0结果仅为历史证据，不代表当前支持范围。

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

- `DoLGameUI-<package.json.version>.mod.zip`
- `StoneFreeHost-<host_version>.mod.zip`
- 六个当前可选包：ModHub、MapleBirch、原版优化、Cheat Extended、ReOverfits、Lyra嘴部兼容，文件名/版本读取各自Manifest；旧Lyra整合包不在此集合。
- `PACKAGE_CHECKS.json`：实际提交、工作区状态、依赖和每个 ZIP 成员的 SHA-256。
- `SHA256SUMS.txt`：八个ZIP与PACKAGE_CHECKS共九个负载的SHA-256，校验清单自身除外。

这些是当前提交的 CI 构建，不是已发布冻结包。文档或构建环境不同可能改变 ZIP 摘要，CI 不据此替换公开附件。

无论成功或失败，已生成的受控测试日志会上传为 `kraft-work-checks-<SHA>`，保存7天。`tests/artifacts/ci/`包含逐项日志、状态、耗时和平台，Actions summary也显示耗时。测试不自动重试；独立Unit/Browser检查在整体预算内继续，有真实前置依赖才标BLOCKED。Unit预算180秒、Browser720秒、Research900秒；预算耗尽为NOT_RUN/UNVERIFIED，实际超时为ERROR。先诊断失败再修复，不通过删断言或反复重跑至绿来收口。

## 验证边界

CI 不代表真实 DoL、Android WebView、物理触控或 Visual Gate 验收。真实回合结算、购买、存读档、社区组合、长期资源观察及真实设备检查沿用项目的独立验收流程。依赖外部游戏源码／Tweego 的历史夹具不纳入此 job。

此配置不修改分支保护，也不自动合并PR。保留现有job/check名称和治理设置；是否调整required checks或bypass，必须由负责人另行决定。

## V1.2 用例与证据合同

执行细则见[V1.2报告](audits/MOODY-CI-V1.2.md)。`@ci-contract`声明及实际测试标签是输入，`npm run ci:lock`生成`scripts/expected.lock.json`，提交时审查差异；`ci:check`重新生成并比较。不能通过手动编辑锁或删除断言取得通过。原三份人工案例JSON已在逐项相等比较后退出，124/241布局计划由实际profile/断点/扫描声明生成，独立验收器只读锁，不安装npm。

可用`MOODY_ORDER_SEED=review-20261023 npm run ci:browser`执行可复现顺序检查；seed与实际顺序进入证据，默认不强制增加高成本矩阵。组合父入口仅记录声明作用域中的健康子案例，预期注入故障继续由父入口的精确断言证明拒绝。旧入口粒度尚未全部拆细，不能把一个entry称为全部内部场景。核心新逻辑见`scripts/ci/*.ts`，CJS保留既有CLI、Node preload/reporter与证据兼容桥。

逐项明细写入必需`checks/<suite>/*.json`，suite只保留紧凑索引；任何必要分片、检查点、45张研究PNG或族报告缺失/超限/错身份/错Hash均拒绝PASS。Manifest记录期望锁Hash、最终源码指纹与SEALED；未完整封存只能诊断。实际upload outcome和上游job结论传给下载验收器；上传故障为ERROR/evidence_upload，已有产品FAIL保留并登记evidence_incomplete。上传后的旁路收据不冒充已包含在其描述的artifact中。

第二构建使用独立Git目录、源覆盖、独立输出/编译缓存与npm缓存，改变TZ/Locale/Umask，保留同一锁定依赖；比较全部ZIP字节和成员元数据。Commit/Run/Attempt等易变身份留在旁路证据，不写入ZIP。

构建和标准证据保留7天，研究证据/下载复核结果保留14天。需要长期保留的验收，应在到期前另存manifest、身份、实际job结论与所需原始附件并重算Hash；不将过期下载链接视为长期验收档案，不建立新归档服务。
