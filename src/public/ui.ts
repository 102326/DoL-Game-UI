/** API 1 / diagnostics schema 1. Types describe existing behavior, not a new runtime. */
export const UI_ROLES = ['page-shell', 'title', 'toolbar', 'section', 'card', 'compact-row', 'list', 'primary-action', 'secondary-action', 'danger-action', 'status', 'badge', 'modal', 'drawer'] as const;
export type UiRole = typeof UI_ROLES[number];
export type VisualTier = 'Smooth' | 'Balanced' | 'Fancy';
export type SelectorCandidates = string[];
export interface StyleAdapter {
 id: string;
 version: string;
 target: {name: string; versions: string[]};
 scope: SelectorCandidates;
 attributes?: string[];
 fingerprint: {id: string; required: SelectorCandidates[]; safe: SelectorCandidates[]};
 roles: {role: UiRole; selectors: SelectorCandidates; all?: boolean; safe?: boolean}[];
 when?: () => boolean;
}
export interface UiCapabilities {
 readonly enabled: boolean;
 readonly visualTier: VisualTier;
 readonly backdropFilter: boolean;
 readonly reducedMotion: boolean;
 readonly glass: boolean;
 readonly motion: boolean;
 readonly layout: 'mobile' | 'tablet' | 'desktop';
 readonly hasSelector: boolean;
 readonly styleAdapters: boolean;
 readonly surfaces: boolean;
 readonly surfaceApiVersion: 1;
 readonly inspector: boolean;
}
export type AdapterStatus = 'idle' | 'inactive' | 'unknown' | 'active' | 'partial' | 'failed' | 'disposed';
export type AdapterMatch = 'none' | 'full' | 'partial';
export interface SelectorMapping {
 readonly role: string;
 readonly primary: string;
 readonly matched: string;
 readonly fallback: boolean;
 readonly count: number;
 readonly reason: string;
 readonly tags: readonly string[];
}
export interface AdapterDiagnostics {
 readonly id: string;
 readonly adapterVersion: string;
 readonly target: string;
 readonly fingerprint: string;
 readonly level: 'Style Only' | 'Disabled';
 readonly status: AdapterStatus;
 readonly reason: string;
 readonly match: AdapterMatch;
 readonly targetVersion: string;
 readonly targetDetected: boolean;
 readonly supportedVersions: readonly string[];
 readonly degraded: boolean;
 readonly mapped: readonly string[];
 readonly skipped: readonly string[];
 readonly selectors: readonly Readonly<{selector: string; fallback: boolean}>[];
 readonly mappings: readonly SelectorMapping[];
}
export interface AdapterHandle {
 refresh(): void;
 destroy(): void;
 getDiagnostics(): AdapterDiagnostics;
}
export type SurfaceCloseReason = 'api' | 'button' | 'escape' | 'backdrop' | 'disabled' | 'destroyed' | 'failed' | 'native';
export interface SurfaceRequest {
 id: string;
 title: string;
 content: HTMLElement;
 onClose?: (reason: SurfaceCloseReason) => void;
}
export interface SurfaceHandle {close(): void; isOpen(): boolean}
export type OpenSurface = (request: SurfaceRequest) => Readonly<SurfaceHandle> | null;
export interface SurfaceDiagnostics {readonly kind: string; readonly source: string; readonly owner: string}
export interface CompatibilityEvent {readonly time: string; readonly level: string; readonly source: string; readonly message: string}
export interface RuntimeDiagnostics {
 readonly schemaVersion: 1;
 readonly uiVersion: string;
 readonly runtimeVersion: '1';
 readonly gameVersion: string;
 readonly loaderVersion: string;
 readonly capabilities: UiCapabilities;
 readonly viewport: Readonly<{width: number; height: number}>;
 readonly platform: 'Android' | 'iOS' | 'Desktop / Other';
 readonly page: Readonly<{name: string; root: string; source: string; adapter: string | null}>;
 readonly surfaces: readonly SurfaceDiagnostics[];
 readonly adapters: readonly AdapterDiagnostics[];
 readonly events: readonly CompatibilityEvent[];
}
export interface UiTheme {
 readonly id: 'soft-wet';
 readonly enabled: boolean;
 readonly tokens: Readonly<Record<'neutral' | 'card' | 'ocean' | 'mist' | 'text' | 'danger' | 'radius' | 'cardRadius', string>>;
}
export interface UiApi {
 readonly apiVersion: 1;
 getTheme(): UiTheme;
 getVisualTier(): VisualTier;
 getCapabilities(): UiCapabilities;
 registerStyleAdapter(spec: StyleAdapter): Readonly<AdapterHandle>;
 getAdapterDiagnostics(): readonly AdapterDiagnostics[];
 getDiagnostics(): RuntimeDiagnostics;
 rescan(): RuntimeDiagnostics;
 openModal: OpenSurface;
 openDrawer: OpenSurface;
 openInspector(): Readonly<SurfaceHandle> | null;
}
