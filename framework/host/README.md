# Stone Free Framework Host

本地 RC-01 候选 `0.1.4-experimental`。提供独立的公共 UI 能力，不包含 Soft & Wet 官方界面。尚未公开发布。

普通玩家使用 Soft & Wet `3.0.0-rc.1` 时，安装本包和官方 UI 两个 Mod 即可。先启用 Host，再启用 UI，按加载器提示重启。不需要 NativeStatus、独立 Motion Hub、Wardrobe Reference、Factory 或 Author Kit。

公共协议仍为 `0.1-experimental`。本版运行代码与0.1.2/0.1.3相同；因安装说明及包身份改变使用新版本，旧0.1.3制品保留。官方UI的最低Host为0.1.2-experimental，不因本包更新而强制其他消费者提高下限。

当前官方UI和标准作者配方使用 `>=0.1.2-experimental && <0.2.0`。这是Loader范围表达式；已验证组合和未来兼容预期分开。Loader2.101.1将0.2.0预发布排序在0.2.0之前，范围可能允许这些版本；它们不在RC-01已验证支持内。破坏性协议演进必须使用新协议标识，消费者仍检查协议与所需能力。Loader依赖报告不保证阻止脚本执行，不能依赖它自动拦截所有错误版本。

同一协议代际内，维护者尽量保留既有方法、场景失效、所有权和结果语义。仅修改UI样式或Host说明，不提高无关消费者的最低版本。新能力由真正调用它的消费者核对最低版本；不承诺任意未来版本或整包热升级。

Host提供有归属的挂载、资源租约、Source、Command和View，不管理游戏变量、Mod加载顺序、存档事务或第三方业务。官方UI使用相同公开接口，没有专用权限。Source失败或Command的unknown不证明业务未执行，不得自动重试。Host需要AbortSignal.any等浏览器能力；不支持时退让，不强行接管。

从2.7升级前备份存档并保留旧包。停用旧DoLGameUI，启用Host和RC UI后重启；不要同时启用两份同名UI或Host。回退时停用新UI、恢复2.7并重启；没有其他消费者时可停用Host。保留旧偏好和新布局数据。主动释放消费者不是加载器整包热卸载。

本包没有GameVersion白名单，也不依赖官方UI；官方UI的游戏版本声明不等于Host适配所有游戏。许可证见LICENSE。反馈可在DoL-Game-UI仓库Issues说明Host/UI/Game版本、设备、复现步骤及可公开截图；不要上传存档、凭证或完整私有日志。
