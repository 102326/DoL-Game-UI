import type {UiApi, SurfaceCloseReason, SurfaceHandle} from '../../src/public/ui';

declare const window: Window & {
 DoLGameUI?: {ui?: Partial<UiApi>};
 SoftWetSurfaceDemo?: Readonly<{
  openModal(): Readonly<SurfaceHandle> | null;
  openDrawer(): Readonly<SurfaceHandle> | null;
  getLastClose(): SurfaceCloseReason | null;
 }>;
};

(function () {
 "use strict";
 if (window.SoftWetSurfaceDemo) return;
 let lastClose: SurfaceCloseReason | null = null;
 function open(kind: 'modal' | 'drawer') {
  const ui = window.DoLGameUI?.ui;
  if (ui?.apiVersion !== 1 || typeof ui.getCapabilities !== "function" || !ui.getCapabilities().surfaces || typeof ui.openModal !== "function" || typeof ui.openDrawer !== "function") return null;
  const content = document.createElement("div"); content.className = "dgu-surface-demo";
  const hint = document.createElement("p"); hint.textContent = "独立 API 示例 · 不连接游戏状态或存档。";
  const row = document.createElement("label"); row.className = "dgu-demo-row"; row.append("示例开关");
  const input = document.createElement("input"); input.type = "checkbox"; input.dataset.demoControl = "switch"; row.append(input);
  const status = document.createElement("p"); status.textContent = "示例关闭";
  input.addEventListener("change", () => {status.textContent = input.checked ? "示例开启" : "示例关闭"});
  const action = document.createElement("button"); action.type = "button"; action.textContent = "示例操作";
  action.addEventListener("click", () => {status.textContent = "已收到原按钮 click"});
  content.append(hint, row, status, action);
  // Both methods were checked above; TS cannot carry that narrowing through a computed key.
  return ui[kind === "drawer" ? "openDrawer" : "openModal"]!({id: "SoftWetDemo-" + kind, title: kind === "drawer" ? "详情浮层 · API 示例" : "二级浮层 · API 示例", content, onClose: reason => {lastClose = reason}});
 }
 window.SoftWetSurfaceDemo = Object.freeze({openModal: () => open("modal"), openDrawer: () => open("drawer"), getLastClose: () => lastClose});
})();
