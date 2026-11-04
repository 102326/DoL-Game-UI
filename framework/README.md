# Soft & Wet 4.x Framework与开发消费者

当前Host机制、公共协议、Source/View/Command、资源所有权与可选接入见[4.x Host合同](../docs/HOST_4X.md)，官方呈现接口见[UI API](../docs/UI_RUNTIME.md)。这些文件描述现役代码，不是旧3.x研究路线。

普通玩家只需当前正式Host与UI及按需兼容包；Factory、NativeStatus、Toolbar、Workspace、独立MotionHub、WardrobeReference及共享Vue比较为源码树中的可选开发/测试消费者，不增加玩家强制依赖。其独立experimental版本不等于UI产品主版本，实际依赖以生成boot.json为准。

开发使用`npm run framework:check`、`npm run framework:build`及与改动匹配的framework测试。Author Kit说明见[作者配方](factory/AUTHOR_KIT.md)；它是源码Kit，不是Loader Mod。不要将历史测试成功、样例存在或公共对象ready视为目标游戏/第三方业务通过。消费者应检查能力，持有并释放注册、挂载、贡献及租约，失败退回自己的原入口。

本目录仍由4.x构建和回归消费，不因源代码历史或实验版号迁入old库。历史设计、旧发行结论和旧版正文已封存；不作为当前实施指令。
