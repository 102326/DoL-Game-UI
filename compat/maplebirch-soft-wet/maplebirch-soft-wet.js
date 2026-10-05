(function () {
 "use strict";
 if (window.MapleBirchSoftWet) return;
 let marked = null;
 function refresh() {
  const enabled = window.modUtils?.getMod?.("maplebirch")?.version === "5.2.3"
   && window.DoLGameUI?.version === "2.0.3"
   && document.documentElement.hasAttribute("data-dol-midnight")
   && window.DoLSavesUI?.getEnabled() === true;
  const panel = enabled ? document.querySelector('#customOverlay[data-overlay="saves"]>#customOverlayContent>#maplebirch-cloud-save.maplebirch-cloud-save') : null;
  const next = panel?.parentElement.parentElement ?? null;
  if (marked === next) return;
  marked?.classList.remove("mbsw-cloud-tools");
  marked = next;
  marked?.classList.add("mbsw-cloud-tools");
 }
 const observer = new MutationObserver(refresh);
 function start() {
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["data-overlay"]});
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ["data-dol-midnight"]});
  refresh();
 }
 document.addEventListener("dol-ui-saves-change", refresh);
 if (document.body) start(); else document.addEventListener("DOMContentLoaded", start, {once: true});
 window.MapleBirchSoftWet = {destroy() {
  observer.disconnect();
  document.removeEventListener("DOMContentLoaded", start);
  document.removeEventListener("dol-ui-saves-change", refresh);
  marked?.classList.remove("mbsw-cloud-tools");
  marked = null;
  delete window.MapleBirchSoftWet;
 }};
})();
