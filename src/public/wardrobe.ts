/** Presentation labels only. Inventory and operations remain native. */
export interface WardrobeSlotMapping {
 id: string;
 /** Exact strings, or >=numeric minimums with UI 2.2.2+. */
 target: {name: string; versions: string[]};
 slots: Record<string, string>;
}
export interface WardrobeSlotMappingHandle {destroy(): void}
/** Discovery is not a business support promise. No inventory or native objects are exposed. */
export interface WardrobeSlotSupport {
 readonly slot: string;
 readonly label: string;
 readonly mapping: string | null;
 readonly canDisplay: boolean;
 readonly operationContract: 'vanilla' | 'author-declared-native' | 'unreviewed';
 readonly reason: 'native-slot' | 'mapped' | 'registration-required' | 'target-not-detected' | 'unsupported-version' | 'missing-native-data' | 'wardrobe-unavailable';
}
export interface WardrobeApi {
 readonly apiVersion: 1;
 registerSlotMapping(spec: WardrobeSlotMapping): Readonly<WardrobeSlotMappingHandle>;
 /** UI 2.3 addition; feature-detect on older API v1 installations. */
 getSlotSupport(): readonly Readonly<WardrobeSlotSupport>[];
}
