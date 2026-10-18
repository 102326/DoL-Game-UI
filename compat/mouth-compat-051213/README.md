# Lyra 嘴部资源兼容 1.0.0

仅适用于 Lyra `0.5.12.13-1.0.1a-1004.1-goose-ucb` 与 MapleBirch `>=5.2.3 <6.0.0` 稳定版，要求角色图层 API 存在。沿用已发布 0.1.2 的版本门槛和 main 嘴部路径修复，拒绝预发布、未知版本及缺失 API。

本包不依赖 UI，不含界面样式，不需要强加 Acrylic。保留 APK 已有的 150 张资源路径；仅注册 main mouth 的 srcfn，不改表情条件、口红、NPC、存档或游戏变量。

加载在 MapleBirch 和角色图层扩展之后；升级替换同技术名旧包，不要重复启用。停用并重启可回退。历史实测为 5.2.3 和 5.4.2，其余声明范围不等于逐版实测。

构建：`python scripts/package-adapter.py compat/mouth-compat-051213`。旧 Lyra 0.5.11.9 专用补丁不进入当前构建组合。
