import type {settingsWeather} from '../src/ui/weather/settings';
function actualFrostSnapshot(surface:ReturnType<typeof settingsWeather>){
 const snapshot=surface.snapshot();
 const study:string|undefined=snapshot.snowStudy;
 const bounds:{x:number;y:number;width:number;height:number}[]|undefined=snapshot.edgeFrostBounds;
 // @ts-expect-error Custom factory snapshot fields retain their actual value type.
 const invalid:number|undefined=snapshot.snowStudy;
 // @ts-expect-error A factory does not invent unprovided snapshot fields.
 snapshot.missingFactoryField;
 return {study,bounds,invalid};
}
void actualFrostSnapshot;
