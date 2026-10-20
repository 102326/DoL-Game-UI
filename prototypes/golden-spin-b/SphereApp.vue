<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref} from 'vue';
import {createSphere} from './sphere';
const canvas=ref<HTMLCanvasElement>();
const phase=ref('idle'), duration=ref(1),strength=ref(1);
const labels:Record<string,string>={idle:'等待蓄势',charge:'球面加速 · 切向回旋',release:'螺旋卷出 · 动能释放',afterglow:'余韵消散 · 自然减速',return:'回旋收束',reduced:'减少动态效果 · 静态展示',disposed:'已卸载'};
let sphere:ReturnType<typeof createSphere>|undefined;
function configure(){sphere?.configure({duration:duration.value,strength:strength.value})}
onMounted(()=>{sphere=createSphere(canvas.value!,value=>phase.value=value);Object.assign(window,{goldenSphereLab:sphere})});
onBeforeUnmount(()=>{sphere?.destroy();delete (window as unknown as Record<string,unknown>).goldenSphereLab});
</script>
<template>
 <main class="sphere-lab">
  <header><p class="sphere-kicker">SOFT & WET 3.1 · MOTION EVOLUTION</p><h1>Golden <em>Spin.</em></h1><p class="sphere-subtitle">铁球刻纹 · 旋转残影 · 流星轨迹</p><span class="sphere-badge">金属球原型 · 待负责人验收</span><p><a href="/hub.html" style="color:#cabb8e">查看完整悬浮球效果 →</a></p></header>
  <section class="sphere-stage" aria-label="球体回旋视觉样片">
   <div class="sphere-stage-meta"><span>01 / THE CORE</span><span>STEEL · MOMENTUM · RELEASE</span></div>
   <canvas ref="canvas" aria-hidden="true"></canvas>
   <button class="sphere-trigger" aria-label="启动球体回旋" @click="sphere?.play()"></button>
   <div class="sphere-stage-caption"><p aria-live="polite">{{labels[phase]}}</p><span>蓄势 → 高速回旋 → 黄金螺旋释放 → 余韵</span></div>
  </section>
  <section class="sphere-controls" aria-label="样片控制">
   <button class="sphere-play" @click="sphere?.play()">启动回旋 <span>↗</span></button><button @click="sphere?.recover()">收束 / 中断</button>
   <label>时间倍率 <b>{{duration.toFixed(2)}}×</b><input v-model.number="duration" type="range" min="0.5" max="2" step="0.05" @input="configure"></label>
   <label>能量强度 <b>{{strength.toFixed(2)}}×</b><input v-model.number="strength" type="range" min="0.3" max="1.3" step="0.05" @input="configure"></label>
  </section>
  <footer><p>本轮只验证球体的回旋感觉。未展开工具，也未改动正式游戏或安装包。</p><p>可重复启动、途中收束；跟随系统“减少动态效果”。旧菜单回旋方向已停止精修。</p></footer>
 </main>
</template>
