import type {NativeEventsHost} from '../runtime/sugarcube';
import type {Host,Participant} from '../../framework/contracts';
import type {navigationMount} from '../ui/navigation-mount';
export type PanelKind='journal'|'traits'|'statistics'|'feats'|'cheats'|'attitudes'|'settings';

export interface PanelControls {
 getEnabled(kind:PanelKind):boolean;
 setEnabled(kind:PanelKind,value:boolean):void;
 refresh():void;
 getLifecycleCounts():{mounts:number;scans:number;failures:number;mountContract:ReturnType<typeof navigationMount>['implementation']|'classic'};
 getLastFailure():string;
 destroy():void;
}
export type StartPanels=(root:NativeEventsHost,framework?:{host:Host;owner:Participant})=>PanelControls;
