# Soft & Wet 4.x UI Runtime — API v1

适用于当前4.1源码及4.2研究的稳定UI接入层。事实源是[src/public/ui.ts](../src/public/ui.ts)、[src/public/wardrobe.ts](../src/public/wardrobe.ts)及运行实现；UI产品版本4.x与`apiVersion: 1`、diagnostics schema1分别管理。

下列呈现接口接入先检查`window.DoLGameUI?.ui?.apiVersion === 1`及所需方法；衣柜命名空间独立，见后文。缺失、禁用、结构不匹配时继续使用消费者自己的原界面，不创建强制Host/UI依赖。

## 查询与Style Adapter

`getTheme()`、`getVisualTier()`、`getCapabilities()`、`getDiagnostics()`和`getAdapterDiagnostics()`读取当前能力/诊断；`rescan()`请求重新识别，不改变游戏场景或业务状态。档位名是现有兼容接口，不是切换旧代主题。

`registerStyleAdapter(spec)`注册有id/version、目标版本、范围、fingerprint、角色selector和可选when的声明式外观适配。目标可用精确字符串或最低数字版本，最低比较依赖Loader的semver工具；工具缺失或比较失败不匹配，不自建宽松比较。必须通过目标、结构与安全角色匹配；未知/部分匹配按实际实现退让。返回handle的`refresh()`、`getDiagnostics()`、`destroy()`由注册者持有，退出时释放标记与监听。

## 自愿浮层

`openModal(request)`、`openDrawer(request)`接受id/title、消费者自己的HTMLElement和onClose，返回只读handle或null；handle提供`close()`及`isOpen()`。消费者保有业务与节点语义，不能通过显示API重试交易或保存。onClose原因包含api/button/escape/backdrop/disabled/destroyed/failed/native；同一窗口的关闭清理应幂等。`openInspector()`只提供诊断入口。

```ts
const ui = window.DoLGameUI?.ui;
const surface = ui?.apiVersion === 1 && ui.getCapabilities().surfaces
  ? ui.openDrawer({id: 'MyMod-details', title: '详情', content,
      onClose() { /* 释放消费者自己的订阅和引用 */ }})
  : null;
// null时保留原界面；退出时surface?.close()。
```

主动贡献Source/View/Command使用独立[Host合同](HOST_4X.md)，不能把UI API v1当成Host协议，也不向第三方暴露官方Store、Vue实例或内部DOM索引。兼容降级、节点/事件、存储与清理都按现役测试保持；版本号出现1不表示这是1.x产品文档。

## 独立衣柜命名空间：wardrobe API v1

`window.DoLGameUI.wardrobe`独立于`.ui`。按需检查`apiVersion === 1`、`registerSlotMapping`及`getSlotSupport`是否存在；不能用UI呈现API的能力检测替代衣柜检测。事实源为src/public/wardrobe.ts与src/wardrobe/main.ts，现役ReOverfits兼容包实际使用此入口。

`registerSlotMapping({id,target:{name,versions},slots:{over_upper:'外套上装'}})`返回可幂等destroy的句柄。目标版本匹配、原库存/定义/穿戴结构存在才允许展示；重复id、重叠槽位、覆盖核心分类或非法字段抛错。消费者应捕获失败并保留原入口。注册者撤销自己的映射，Core销毁后旧句柄失效，API实例更换后重新检测/注册。

映射只扩展展示语义，不接受业务状态、任意回调、操作执行器或库存镜像，不代替原生穿戴链。槽位作者必须保证既有wear_<slot>/updatewardrobe及整理操作真实可用；私有库存或专属操作应保留原入口，不假装原生业务。注册/撤销刷新分类并取消尚未执行的整理确认；已开始的原业务按既有流程结束，不擅自重试。

`getSlotSupport()`返回冻结的slot/label/mapping/canDisplay/operationContract/reason记录，不暴露库存、节点或游戏变量。reason包含native-slot、mapped、registration-required、target-not-detected、unsupported-version、missing-native-data、wardrobe-unavailable；operationContract区分vanilla、author-declared-native、unreviewed。canDisplay只表示展示结构条件，不能证明当前操作可用；author-declared-native只是作者声明，仍须校验当前页面、原对象和索引的新鲜度，不代表Core审过所有第三方业务。
