# EVO-A2 / 原生导航坐标收敛首批

范围已由负责人批准。本批Implemented / Controlled Tested；不是A2全部完成或G1通过。

## 做了什么

`src/ui/navigation-geometry.ts`统一viewport矩形到滚动容器CSS坐标的换算，拒绝非有限/零尺度值。A1共用导航（属性＋社交）和`src/panels/main.ts`的overlay导航均实际调用；原来的复制换算和面板直接矩形差路径已删除。属性/社交保留16px、面板保留12px余量，业务事件和视觉演出不变。

面板的不同宿主没有被硬塞进A1 overlay壳：Attitudes/Settings passage仍保持原scrollIntoView与passage lifetime，overlay仍保持persistent；本批没有声称这些生命周期全部迁移。

## 红绿证据

新`tests/evolution-panels.cjs`加载真实入口、Vue和生产CSS。旧实现实际以日志1.25倍Zoom失败：gap=-172.5px，目标15px；不是语法或缺依赖失败。接入共用换算后，日志、特质、统计、成就、作弊、游戏设置六类overlay在1/.85/1.25倍Zoom均通过，原生按钮仍为同节点并只调用两次，释放无自有导航残留。

排查时修正了夹具的成就入口：真实data-overlay是gameFeats，不是feats；没有为了测试向生产代码增加别名。

既有`tests/panels-framework.cjs`改用项目browser-options（Windows仍Edge，Mac/Linux用锁定Chromium），保留overlay/passages、scene失效/重入、owner退出/peer保留、classic路径与原节点事件断言并实际通过。A1两消费者回归也通过。标准和研究CI均增加对应入口检查，具体提交/Run见#22第二轮记录。

## 未做

面板租约事务仍有独立实现，尚未全部进入共同管理合同；没有借坐标修复包装成生命周期债务全部清偿。OrbitFocus、通用呈现、其它固定代理及其它消费者的坐标/属性争用待后续逐项迁移。真实游戏、第三方混合环境和设备输入未验收。
