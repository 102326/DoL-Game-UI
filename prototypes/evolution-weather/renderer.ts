import {rainMaterial,type MaterialKind} from './material';
import {wetGlass} from './wet-glass';
import {featherSnow,powderSnow} from './snow-material';
import {readGameWeather} from '../../framework/official-ui/weather';
import {weatherSurface as ownedSurface} from '../../src/ui/weather/surface';
type Weather=ReturnType<typeof readGameWeather>;
/** Historical study candidates keep their original material flags and pace. */
export function weatherSurface(canvas:HTMLCanvasElement,read:()=>Weather=readGameWeather,kind:MaterialKind|'glass'|'glass-natural'|'glass-runoff'|'glass-weather'|'glass-shower'|'glass-force'|'glass-scatter'|'glass-feather'|'glass-powder'='beads'){
 const study=kind==='glass-feather'||kind==='glass-powder';
 const climate=study||kind==='glass-weather'||kind==='glass-shower'||kind==='glass-force'||kind==='glass-scatter';
 return ownedSurface(canvas,read,invalidate=>kind.startsWith('glass')?wetGlass(canvas,invalidate,kind!=='glass',kind==='glass-runoff'||climate,climate,kind==='glass-shower'||kind==='glass-force'||kind==='glass-scatter'||study,kind==='glass-scatter'||study?'scatter':kind==='glass-force',kind==='glass-feather'?featherSnow:kind==='glass-powder'?powderSnow:undefined):rainMaterial(canvas,kind as MaterialKind),{pace:(kind==='glass-scatter'||study)?.25:1,climate});
}
