/** Presentation labels only. Inventory and operations remain native. */
export interface WardrobeSlotMapping {
 id: string;
 /** Exact strings, or >=numeric minimums with UI 2.2.2+. */
 target: {name: string; versions: string[]};
 slots: Record<string, string>;
}
export interface WardrobeSlotMappingHandle {destroy(): void}
export interface WardrobeApi {
 readonly apiVersion: 1;
 registerSlotMapping(spec: WardrobeSlotMapping): Readonly<WardrobeSlotMappingHandle>;
}
