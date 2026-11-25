# 静水星仪 · 正式入口中性预览

以同一批 Host 和 UI 玩家 ZIP 生成可离线打开的 HTML。预览中的按钮、SVG、菜单和停靠来自实包。中性页为真实原生入口提供计数回执，隔离页仅在这次打开期间保留偏好。

```sh
node prototypes/host5/hub-preview/build.mts "$HOST_ZIP" "$UI_ZIP" crown.html
node prototypes/host5/theme/crown-dock-check.mts "$HOST_ZIP" "$UI_ZIP"
node prototypes/host5/theme/sidebar-check.mts "$RELEASE_HOST_ZIP" "$HOST_ZIP" "$UI_ZIP"
```

拖动后松手可把球留在屏幕中间。用列表菜单选择“停靠侧边”，点击露出的弧面恢复，或直接拖回正文旁。切换横竖视口、开关玻璃与动效后重复。键盘用 Tab 聚焦入口、Enter 展开、Escape 关闭。弧线布局继续沿用已有的靠边闲置停靠规则。

命中检查通过实际浏览器坐标、元素命中与鼠标操作核对左右收边、自由恢复和盒外正文。安全区采用浏览器注入值。请在家庭设备复查 Android 边缘返回手势、系统栏、键盘与分屏，以及 Windows 触控；Mac 中性记录不能判定设备续航或真实触控手感。
