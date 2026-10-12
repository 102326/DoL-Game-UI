<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import type {FloatingState} from './main';
import type {ToolId} from './preferences';
defineProps<{state:FloatingState;toggle:(event:MouseEvent)=>void;down:(event:PointerEvent)=>void;move:(event:PointerEvent)=>void;up:(event:PointerEvent)=>void;cancel:()=>void;run:(id:ToolId)=>void;grid:()=>void;close:()=>void;configure:()=>void;hide:()=>void;position:(axis:'x'|'y',value:number)=>void;lock:(event:PointerEvent)=>void;unlock:(event:PointerEvent)=>void;guard:(event:MouseEvent)=>void}>();
</script>
<template>
 <div class="dsf-layer" @keydown.esc.stop.prevent="close" :class="{'dsf-dragging':state.dragging}" :style="{left:state.x+'px',top:state.y+'px'}">
  <GameButton class="dsf-ball" aria-label="自由悬浮球" aria-haspopup="menu" :aria-expanded="state.open" @click="toggle" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="cancel" @lostpointercapture="cancel"><span aria-hidden="true">◈</span></GameButton>
  <div v-if="state.open" class="dsf-menu" :class="{'dsf-fan':state.mode==='fan'&&!state.config,'dsf-grid':state.mode==='grid'||state.config}" role="menu" aria-label="悬浮快捷工具" :style="{left:state.menuX+'px',top:state.menuY+'px',width:state.menuWidth+'px',maxHeight:state.menuMaxHeight+'px'}" @keydown.esc.stop.prevent="close" @click.capture="guard" @pointerdown="lock" @pointerup="unlock" @pointercancel="unlock" @lostpointercapture="unlock">
   <template v-if="!state.config">
    <GameButton v-for="(tool,i) in state.tools" :key="tool.id" role="menuitem" :style="state.mode==='fan'?{position:'absolute',left:state.fan[i]?.x+'px',top:state.fan[i]?.y+'px'}:{}" :title="tool.reason||tool.description" @click="run(tool.id)"><span aria-hidden="true">{{tool.icon}}</span><span>{{tool.name}}</span></GameButton>
    <GameButton v-if="state.mode==='fan'" class="dsf-all" role="menuitem" @click="grid">▦ 全部工具</GameButton>
    <GameButton v-else role="menuitem" @click="configure">⚙ 位置与选项</GameButton>
   </template>
   <div v-else class="dsf-position"><strong>移动悬浮球</strong><label>水平位置 <input aria-label="悬浮球水平位置" type="range" min="0" max="100" :value="state.intentX*100" @input="position('x',Number(($event.target as HTMLInputElement).value)/100)"/></label><label>垂直位置 <input aria-label="悬浮球垂直位置" type="range" min="0" max="100" :value="state.intentY*100" @input="position('y',Number(($event.target as HTMLInputElement).value)/100)"/></label><p>无需长按，也可用方向键调整滑块。长按球体可自由拖动。</p><GameButton @click="hide">暂时隐藏悬浮球</GameButton><small>在界面设置中找回或关闭。</small></div>
   <p v-if="state.message" class="dsf-message" role="status">{{state.message}}</p>
   <GameButton class="dsf-close" role="menuitem" @click="close">收起工具</GameButton>
  </div>
 </div>
</template>
