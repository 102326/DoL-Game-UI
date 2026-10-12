# Stone Free 3.0：Windows 接续与真实工具使用

当前开发工作树 stone-free-30 / dev/stone-free-3.0-current，从293088ad15df3f481bd191271b512c55df32b3ce继承NO.1悬浮球，没有合并基于2.5的Lab分支。

## 本轮交付

- 保留悬浮球及3.0代码，补入正式2.6的50–150一次性迁移、原浮层宽度和战斗图组修复。已有迁移标记的用户保留选择。
- 当前真实悬浮组件和Toolbar接入独立Lab，各自列明源码输入，没有新SDK、游戏Runtime或业务代理。
- 悬浮菜单外壳跟随玻璃开关，Fancy稍增透光；按钮保留稳定底色。这是样式完善，不是业务Bug修复。
- 原型包安装平板独立0.5.12.13测试版，2.6原包及Mod顺序已备份；手机保持2.6。不发布3.0。

## 已验证

Lab类型检查、正式typecheck/build/package、Source Index三项、悬浮偏好／边界／运行测试、继承的display-scale／overlay／illustration定向验证通过。真实Chrome/Vite验证390px同源组件、内存回调、样式HMR与恢复、玻璃档位和源码线索。ZIP无Lab/index/maps。

平板真实长按拖动产生trusted Pointer、保存位置且不误开菜单；恢复位置后网格blur24px。设置入口打开原设置Modal时悬浮宿主暂停，关闭后恢复。测试前后Passage、货币及combat字段一致，未执行Gameplay回合或存档业务。物理手机3.0和更深游戏流程未验证。

## 真实反馈与归属

1. A consumer只认识shop.toolbar：当前商店matched，floating.tools为Unknown/index-format。属于声明的覆盖边界，不认定Tools缺陷。建议Owner登记明确floating profile或unsupported-component原因，验证后决定，不自动开工。
2. 旧Lab引用当前3.0没有的utilities.css，导致索引503与入口失败；已按实际样式入口调整。是项目薄接入差异，不能复制生产文件或回退工程来迁就旧Lab。
3. 折叠details的innerText为空，异步刷新索引暂时null。改用textContent并等待非null数据，属于探针读取方式。
4. 手动CSS编辑晚于探针30秒等待（ready00:00:34、编辑00:01:10），首次未取得终态，不推断Vite坏了。之后用无业务影响的HMR控制样式验证并恢复原字节，首次失败保留。
5. Lab几何、内存回调和游戏Runtime分开；平板设置／拖动是独立真实证据，不能从matched推导业务完成。

关闭了测试自己的浏览器／Vite。未修改Tools源码、全局配置、GER Store或历史Unknown，无Full Evidence或平台重构。

接续和NO.1工具／材质范围Completed；不是完整3.0完成。下一项是NO.2自有设置收敛。Widget与剧情动作分区尚未实现，不扩成强制首发大系统。
