# 4.0.0 分发校验与文件名

本目录的`SHA256SUMS.txt`使用实际发布附件名。公开附件采用ASCII名称，九个Mod ZIP不重新压缩，摘要与[受验CI原包](../../evolution/EVO-4.0.0-PACKAGES-2026-10-25.json)相同。

三个名称按既有发布风格整理，其余六包名称保持：

| CI原始文件名 | 发布附件名 |
| --- | --- |
| `DolOptimizationSoftWet-原版优化-1.1.1.2-plus-v1.0.3.mod.zip` | `DolOptimizationSoftWet-Optimization-1.1.1.2-plus-v1.0.3.mod.zip` |
| `CheatExtendedSoftWet-cheat extended-1.20.3-plus-v1.0.0.mod.zip` | `CheatExtendedSoftWet-CheatExtended-1.20.3-plus-v1.0.0.mod.zip` |
| `SmartPhoneSoftWet-SmartPhone Alpha-0.3.91-plus-v1.1.1.mod.zip` | `SmartPhoneSoftWet-SmartPhoneAlpha-0.3.91-plus-v1.1.1.mod.zip` |

GitHub可能规范化上传文件名，依据见[官方上传说明](https://docs.github.com/en/rest/releases/assets#upload-a-release-asset)。本映射仅涉及外层文件名，不改变boot.json、Mod技术身份、依赖、许可、业务或存档。每个附件上传后仍须下载读回并按此清单验证。

九个Mod ZIP和SHA清单是发布附件；截图、视频与技术报告不放入Assets。
