# Kraft Work 3.0.4 — P0 启动热修复验证

关联 [Issue #18](https://github.com/102326/DoL-Game-UI/issues/18)。正式基线为 main/v3.0.3 `450e86042fb5ca2d419d251cfc66a1044c730999`，开发分支 `fix/startup-host-compat`。本轮修复已复现启动路径；报告者具体游戏、加载器和 WebView 尚未确认，不能据此认定所有“无反应”报告都同源。

## 复现、修复与证据边界

- 下载官方 UI 3.0.3 和 Host 0.1.4，核对公开 SHA256、CRC、正式入口。受控 HTML 装载实际 JS/CSS 时正常启动；仅移除 `AbortSignal.any` 后 Host、UI、设置与 Hub 全部缺失，只有控制台告警。不是缺少完整游戏导致的同等结论。
- 新回归先对旧构建失败，断言为 `missing-any: Host must start`。修复后相同场景通过，且 `AbortSignal.any` 仍为 undefined，未修改浏览器全局。
- Host 使用局部、可释放的取消信号合并。测试覆盖挂载/场景两种取消、首个 reason、已取消输入顺序、监听移除、重复 binding 缓存、场景切换与卸载，不弱化原生命周期合同。
- UI 新增独立可关闭提示，覆盖缺少 Host、协议不符、初始化失败、停止与恢复。回归共八种启动场景，含保存的关闭总开关、迟到 Host、未知对象保留、诊断关闭与卸载；设置通过公共 API 验证。未把夹具中缺少游戏 CSS 导致的抽屉遮挡误报成产品缺陷。

## 实际检查

macOS arm64、Node 24.18.0、Python 3.12.14、Playwright 1.63.0 / Chromium 153.0.8010.12。`npm run ci:check`、`npm run ci:unit` 已通过；启动回归已通过。最终包合同、共享 Framework 回归及真实 PR/main CI 需在交付报告关联精确提交和 Run，不以本段预告充当通过。

首次包构建被 `CJ3C_HOST_DOCUMENTED_VERSION` 拒绝：Host README 的版本缺少合同要求的反引号。修正文档后重验；原失败日志保留本地。随后检查拒绝 dist/ci-packages 中残留的 3.0.1 文件，完整移出旧目录后使用独立输出重验，未删除证据或放宽白名单。Python 制品检查器负责精确版本、依赖和成员合同；整轮汇总器负责身份、规定结构和两轮一致性，不是另一套独立 ZIP 合同检查器。

## 发行与未覆盖

发布两个新包 UI 3.0.4 / Host 0.1.5-experimental；协议 0.1-experimental 和 Host 依赖范围不变。七个可选兼容 ZIP 从 3.0.3 公开附件原样沿用，其中万能手机 1.1.0 的独立源码未合入 main。不上传研究/AuthorKit 构建或测试原始日志。冻结摘要与成员身份见 `releases/3.0.4/`；最终上传与回读结果见交付报告。

负责人明确按 P0 授权跳过实机等待。本轮未进行实际 Android WebView、iOS、Windows 或真实游戏/ModLoader 联合验收，没有读取或上传玩家存档。Playwright 受控启动与 CI 不等于这些平台已通过。旧 Release/Tag 保留。仅改 Host 的后续维护应只升级 Host 并醒目标注；本次 UI 另有启动诊断变更，因此 UI 独立升至 3.0.4。
