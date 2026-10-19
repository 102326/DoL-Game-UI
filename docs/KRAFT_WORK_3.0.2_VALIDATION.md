# Kraft Work 3.0.2 验证范围

## 变更与来源

本轮仅发布设置窗口全局缩放修复、Windows 历史反例路径修补及版本／文档更新。问题见 [#10](https://github.com/102326/DoL-Game-UI/issues/10)，修复见 [PR #11](https://github.com/102326/DoL-Game-UI/pull/11)。运行逻辑基线为 `f672ab30683a1ae5e0eb28d85aed21f0efa917e4`，合入 main 为 `8e1785c12dc51c034ac0e2caffe3cf9fb50ef2ea`，两者源码树相同。

3.0.2 不改变 Host 公共协议、依赖范围或兼容包实现。所有现行 UI 设计使用 [3.X 基线](VISUAL_BASELINE_3X.md)，旧 1.X／2.X 设计封存；这不删除配置迁移或原游戏回退逻辑。

发行准备另外修正包合同测试夹具的文件编码：所有文本读写明确使用 UTF-8，避免 Windows 系统默认 GBK 将反例源码写坏。首次检查的解码失败及修改夹具后旧构建回执被拒绝的记录均保留；重新构建后验证，不删除断言或接受旧回执。

## 实际验证

| 环境 | 输入与检查 | 结果 |
| --- | --- | --- |
| Windows / Edge 受控浏览器 | 400×821、821×400；字体 80%；全局缩放 80%／100%／125%；外壳四边、视口边缘命中、原控件及长内容滚动 | 通过 |
| Android 17 / WebView 155，独立测试 App | DoL 0.5.12.13 / Loader 2.101.1；400×821 CSS px；字体 80%；游戏原生 zoom 80%／90%／100%／125%；双布局选择和窄屏回退 | 通过 |
| 同一 Android 场景 | 修复前 zoom(90) 重现材质重复缩小；修复后材质矩形最大误差约 0.006 CSS px，遮罩覆盖视口，无水平溢出 | 通过 |
| Android 程序控制／合成触控 | 原设置修改并恢复；滚动 scrollTop 0→191.11；关闭后装饰层释放；恢复字体和游戏缩放 100% | 通过；不是物理手指证明 |
| Windows 历史反例测试 | 规范化 Vite 路径后确实注入旧实现，原断言拒绝错误几何；保留首次超时记录 | 通过 |
| 修复 PR CI | [Run 39283083644](https://github.com/102326/DoL-Game-UI/actions/runs/39283083644)，validate／moody-gate，精确 head f672ab3 | 通过 |
| 修复 main CI | [Run 39287583419](https://github.com/102326/DoL-Game-UI/actions/runs/39287583419)，validate／moody-gate，精确 head 8e1785c | 通过 |

Android 先同步并核对已有平板测试组合，包括 ModHub 1.7.6、MapleBirch 5.5.0、原版优化 1.1.1.5、CE rebuild.30 和 Host 0.1.4-experimental。同步、实际加载成员及修复后原始截图均保留本地，不上传设备标识、私人数据或第三方运行包。没有操作存档、云端业务或战斗继续。

## 发布制品与复用边界

实机检查使用修复提交构建的测试候选，技术版本当时仍为 3.0.1，不能混同原公开 3.0.1 包。正式 3.0.2 在该实现上只更新产品版本、说明与包合同。逐字节对比确认：主脚本仅产品版本由 3.0.1 改为 3.0.2；CSS、早期脚本、Twee、类型声明与许可证成员完全相同。因此复用这项实机行为证据，不声称已在手机安装正式 3.0.2 ZIP。

本地正式版本的 `ci:check`、八包构建与两次构建一致性、七项包合同反例测试、`settings-ci.cjs` 和 `official-defaults.cjs` 均通过。发布源码与附件身份见 [SOURCE_IDENTITY.json](releases/3.0.2/SOURCE_IDENTITY.json)；GitHub CI 的最终结果以对应 PR／main 精确提交检查为准。

Host 与六个兼容包使用 3.0.1 Release 的冻结原包，必须逐项 SHA-256 匹配。新 UI 使用最终源码重新构建，八包结构及两次构建一致性由现有 CI 检查；实际 Release 附件摘要记入 `releases/3.0.2/SHA256SUMS.txt`，不覆盖旧 Release。

## 未覆盖与已知限制

本轮没有真实 iOS、物理手指、报告者设备或全部游戏／Mod／交易／战斗场景证明。报告者全局缩放配置仍 Unknown；本机复现不冒充其原始环境。既有存读档和社区兼容记录属于历史证据，详见 [3.0.1 记录](KRAFT_WORK_3.0.1_TABLET_COMPAT_20261019.md)。系统选择器能力、历史 selectedWardrobe 异常、未归因社区告警及长期资源变化不因本轮发布被宣布解决。
