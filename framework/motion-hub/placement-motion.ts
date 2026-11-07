import type {Snapshot} from './edge-physics';

/** Internal presentation bridge; not part of Host or persisted state. */
export interface PlacementMotion {
 read():Snapshot&{frames:number};
 subscribe(listener:()=>void):()=>void;
}
