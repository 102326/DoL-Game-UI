# Soft & Wet 4.x GitHub协作

本文件描述当前源码内的表单和协作约定。旧3.x首次部署/堆叠PR审计已封存，不再充当远端现状。

当前六类Issue表单位于.github/ISSUE_TEMPLATE：bug-report、compatibility-bug、compatibility-request、feature-request、ui-ux-feedback、engineering；PR模板为.github/pull_request_template.md。中文/英文均可，不要求玩家翻译日志或双语填写。

问题优先提供UI/Host/目标Mod版本、实际环境、操作与预期、截图/必要错误；模拟/真机和未验证部分分别说明。不要公开凭据、私人存档或敏感设备信息；授权存档仅隔离复现，不自动进入公开CI。

按实际影响在现有Issue集中简短更新重要批次，不重复建立路线图。设计参考、原型、工程PASS、视觉认可、真实宿主、正式集成和发布分开记录。失败不以重复提交/补跑掩盖。

分支/PR描述讲清问题、改动、验证与限制。main合并走现有Ruleset与真实required检查，不制造状态或调整bypass；发布需单独授权。CI按批次政策见[CI](CI.md)，接力状态见[HANDOFF](HANDOFF.md)。本次旧资料迁移在独立分支交付，未自动合main。
