(function () {
 "use strict";
 if (window.LyraWardrobeMouthSoftWet) return;
 function prepare(event) {
  if (window.modUtils?.getMod?.("Lyra")?.version !== "0.5.11.9-1.0.0a-0815-goose-ucb") return;
  const mouth = event.detail?.model?.layers?.mouth;
  if (typeof mouth?.srcfn !== "function") return;
  mouth.srcfn = options => options.facestyle === "default"
   && /^(default|aloof|catty|foxy|gloomy|sweet|modded(?:[1-9]|1[0-9]|2[0-4]))$/.test(options.facevariant)
   && /^(chew|cry|frown|neutral|smile)$/.test(options.mouth)
   ? `img/face/${options.facestyle}/${options.facevariant}/mouth-${options.mouth}.png`
   : `img/face/${options.facestyle}/mouth-${options.mouth}.png`;
 }
 window.addEventListener("dol-ui-outfit-prepared", prepare);
 window.LyraWardrobeMouthSoftWet = {destroy() {
  window.removeEventListener("dol-ui-outfit-prepared", prepare);
  delete window.LyraWardrobeMouthSoftWet;
 }};
})();
