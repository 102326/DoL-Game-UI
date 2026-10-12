# Paisley Park Component Lab（Mac 先行原型）

直接预览 `src/shop/Toolbar.vue`，复用 GameButton、shop 样式、主题和共享 `cu:*` utilities。不加载 `src/main.ts`/startShop，不读取游戏、偏好或存档。

## 启动

Node >=22.12；在这个 UI 工作区运行 `npm ci --ignore-scripts --no-audit --no-fund`，然后 `npm run lab`。默认地址 `http://127.0.0.1:5175/`，占用时使用 `npm run lab -- --port 5176`，以实际终端 URL 为准。仅回环访问；Ctrl+C 关闭本轮 server。无需安装全局 Skill、Storybook 或游戏资源。

场景选择普通、窄/紧凑、长标题/状态消息。改变进店默认分类，展开分类或商品详情，页面显示内存回调；Escape 退出 Lab 分类/详情。`shopCategories` 和详情区域是明示的 Lab 占位，不是原生列表。滑杆仅改变容器几何，narrow/compact 来自场景 props；父层自动宽度监听未接入，不要将它称为自动响应式验收。

编辑正式 Toolbar 或 `src/shop/style.css` 可看到真实 Vite HMR。索引面板和组件线索由 dev-server 刷新；保存旧副本可验证过期。`npm run lab:check` 检查独立入口类型，`npm run lab:build` 输出至 ignored `tests/artifacts/component-lab-dist/`，不清理正式 dist。构建预览没有 dev-server 的索引 endpoint，不能冒称同样的 Source Link 运行身份。

## Source Link 联合使用

```
node component-lab/source-index.cjs --out NEW_INDEX.json
node /ABS/TOOLS/integrations/soft-and-wet/source-link.cjs --root /ABS/UI --index NEW_INDEX.json --clue CAPTURED_CLUE.json --out NEW_RESULT.json
```

从 Lab 的“所选 owned host 线索”保存 JSON。输出已匹配/过期/未知（Git 元数据缺失时可部分匹配）；只核对覆盖文件的字节及 Git、组件标记。样式是候选，不是计算样式归因；运行制品和生产回调未独立证明。旧线索、旧索引、同 HEAD 下改字节会失效；普通 Debug 和组件交互不被它阻止。

## 本机联合测试

设置 **已安装** Chrome 和选定 Tools 的绝对路径，再运行：

```sh
DOL_LAB_CHROME='/absolute/installed/Chrome' DOL_LAB_TOOLS='/absolute/selected/Tools' npm run lab:test
node --test tests/component-lab-source-index.test.cjs
```

测试只创建自己的 loopback Vite、带 Chromium sandbox 的 Playwright Chrome 上下文；临时编辑原组件/样式后恢复原字节，并关闭自身 browser/server。输出、截图、index/clue/result 在 `tests/artifacts/lab-*/`，不发布。启动失败与未执行项保留，不无限重试。

Windows PowerShell 7 接续配方（本轮未在 Windows 验收）：

```powershell
$env:DOL_LAB_CHROME = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
Test-Path -LiteralPath $env:DOL_LAB_CHROME
$env:DOL_LAB_TOOLS = 'C:\YOUR_WORKSPACE\DoL-Dev-Tools-Paisley-Park-5.0-mac'
npm run lab
# 另一个终端（相同环境）运行 npm run lab:test
```

每台平台按锁安装自身依赖，不复制 node_modules。`npm run package` 使用项目内 Node 入口，在 Mac 默认 python3、Windows 默认 python；缺别名/版本不符时设置 `DOL_PYTHON` 为实际 Python 3.10+ 的可执行文件，不改系统 PATH。普通 ZIP 仍按原显式清单，不含 Lab、源码索引或 map。
