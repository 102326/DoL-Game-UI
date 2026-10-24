import {weatherSurface} from './surface';
import {wetGlass} from './wet-glass';
import {frostedFeatherSnow} from './edge-frost';
import type {readGameWeather} from '../../../framework/official-ui/weather';
import './settings.css';

/** C5.2/R10 with feather snow and edge frost; the caller owns the one game-weather poll. */
export function settingsWeather(canvas:HTMLCanvasElement,read:()=>ReturnType<typeof readGameWeather>){
 return weatherSurface(canvas,read,invalidate=>wetGlass(canvas,invalidate,true,true,true,true,'scatter',frostedFeatherSnow,true),{pace:.25,climate:true,managedPoll:true,respectMotion:true});
}
