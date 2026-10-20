# Stone Free Framework Host `0.1.5-experimental`

Soft & Wet 3.0.4 的配套 Host，提供独立公共 UI 能力，不包含官方界面。先启用Host，再启用UI，按加载器提示重启；不需要开发样例、独立Motion Hub、Factory或Author Kit。

本次P0修复不再硬依赖AbortSignal.any，使用Host内部信号合并保留挂载和场景取消、原因与监听清理，不修改浏览器全局。仍需要基础AbortController、MutationObserver及其它实际UI能力，不保证所有旧浏览器兼容。

公共协议保持0.1-experimental，官方UI范围保持>=0.1.2-experimental && <0.2.0；旧0.1.4在现代环境的接口兼容性保留。缺少any的环境必须更新Host，不能仅更新UI。Loader预发布版本比较限制仍在，依赖报告不保证阻止全部错误版本脚本执行。

Host不接管游戏变量、Mod加载顺序、存档事务或第三方业务。未知Host实现不覆盖、不处置。Source失败或Command的unknown不证明业务未执行，不自动重试。

回退时恢复保留的UI与Host并重启；其它消费者仍依赖Host时不要直接停用。无需迁移或清空存档。历史0.1.4发布包保持原样，不承诺整包热升级。

本次P0经负责人授权先发布，未等待真机验收；测试范围见项目3.0.4验证记录。反馈请提供游戏、Loader、UI/Host、实际浏览器或WebView、复现步骤；不要公开凭据或敏感设备标识。授权存档仅源码树外隔离复现，不自动进入CI。许可证见LICENSE。
