# Soft & Wet 2.5 — Crazy Diamond 开发版

本地开发标识 `2.5.0-dev.1`，不是正式 Release。基于 `candidate/soft-wet-2.3` 的 `06de7f9799c5599642545100d51a2a92f4cae8c1`，开发分支为 `dev/crazy-diamond-2.5`。

继承 M2～M4-B 的衣柜来源与单击穿戴、商店原商品与报价绑定、战斗原控件保护、存档复核及回退，以及 API v1、主题、Surface、Inspector 和 gameTime 附加字段保留。衣柜浏览模式已删除，不会恢复。

本批顺序：专项测试入口收口；本地高频页面宽/窄容器与触控检查；衣柜跨分类搜索。专门衣物比较、新批量操作及自由布局系统不在范围。

验证层级：`npm test` 在已有构建前提下执行 Node 合同测试（npm 的 pretest 会先构建）；`npm run test:quick -- wardrobe|shop|combat|saves` 只执行所选组与其必要来源合同；`npm run test:release` 再包含较慢的原游戏 M2 集成。使用 `--plan` 查看资源、步骤及缺失文件，不执行构建。任何失败停止后续步骤并保留报告。

历史手机及平板记录见 `CLOSEOUT_2_3_RC.md`。本批仅获本地浏览器测试授权，窄容器不等于真实 Android 分屏；不连接设备、不修改用户存档、不合并正式 main、不发布。各阶段结果和证据在 `WORK_2_5.md` 收口。
