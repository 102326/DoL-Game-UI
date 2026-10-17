# Stone Free Framework Host

本地评审候选 `0.1.3-experimental`，与 Soft & Wet 官方 UI `3.0.0-lab.17` 配对。尚未正式发布。

普通玩家安装本包和官方 UI 两个 Mod 即可。先启用 Host，再启用官方 UI，按加载器提示重启。不需要 NativeStatus、Motion Hub、Wardrobe Reference、Factory 或 Author Kit。

Host 提供有归属的 UI 挂载、场景失效、资源租约、Source、Command 和 View。它不接管游戏变量、Mod 加载顺序、存档事务或第三方业务。官方 UI 使用相同的公开接口，没有专用权限。

公共协议仍为 `0.1-experimental`，不同于本包版本，也不同于官方 UI API v1。当前只支持明确配对；不承诺任意新旧消费者混装或热升级。作者应检查协议、所需方法和能力，遇到不支持的环境退让。Source 失败或 Command 的 unknown 不代表业务未执行，不能据此自动重试。

从 2.7 升级前备份存档。停用旧 DoLGameUI，启用本 Host 和配对官方 UI 后重启，不要同时启用两份同名官方 UI。回退时停用新 UI，恢复 2.7 后重启；没有其它消费者需要 Host 时也可停用 Host。不要删除旧 UI 偏好。主动释放消费者只清理自身资源，不等于加载器整包热卸载。

包内 LICENSE 为项目许可证。其它独立消费者的代码、依赖与许可证由其作者负责。此包不包含游戏资产、官方 UI、第三方 Mod、存档或测试记录。
