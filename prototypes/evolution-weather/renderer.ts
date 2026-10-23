import {rainMaterial,type MaterialKind} from './material';
import {wetGlass} from './wet-glass';
import {readGameWeather} from '../../framework/official-ui/weather';
import {weatherSurface as ownedSurface} from '../../src/ui/weather/surface';
type Weather=ReturnType<typeof readGameWeather>;
/** Historical study candidates keep their original material flags and pace. */
export function weatherSurface(canvas:HTMLCanvasElement,read:()=>Weather=readGameWeather,kind:MaterialKind|'glass'|'glass-natural'|'glass-runoff'|'glass-weather'|'glass-shower'|'glass-force'|'glass-scatter'='beads'){
 const climate=kind==='glass-weather'||kind==='glass-shower'||kind==='glass-force'||kind==='glass-scatter';
 return ownedSurface(canvas,read,invalidate=>kind.startsWith('glass')?wetGlass(canvas,invalidate,kind!=='glass',kind==='glass-runoff'||climate,climate,kind==='glass-shower'||kind==='glass-force'||kind==='glass-scatter',kind==='glass-scatter'?'scatter':kind==='glass-force'):rainMaterial(canvas,kind as MaterialKind),{pace:kind==='glass-scatter'?.25:1,climate});
}
