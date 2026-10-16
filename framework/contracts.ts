/** Stone Free research protocol. Not the stable DoLGameUI.ui API v1. */
export const PROTOCOL = '0.1-experimental' as const;
export type Lifetime = 'passage' | 'persistent';
export type Cleanup = () => void;
export type ResourceKind = 'region' | 'shortcut' | 'modal';
export type Json = null | boolean | number | string | Json[] | {[key: string]: Json};
export interface Binding {
 readonly signal: AbortSignal;
 readonly generation: number;
 isCurrent(): boolean;
}
export interface MountContext {
 readonly element: HTMLElement;
 readonly signal: AbortSignal;
 isCurrent(): boolean;
 fail(): void;
 binding(): Binding;
 onCleanup(callback: Cleanup): void;
 onScene(callback: () => void): Cleanup;
}
export interface MountRequest {
 id: string;
 parent: HTMLElement;
 lifetime: Lifetime;
 setup(context: MountContext): void | Cleanup | Promise<void | Cleanup>;
}
export interface MountHandle {dispose(): void; isCurrent(): boolean; readonly ready: Promise<void>}
export interface Claim {release(): void; isCurrent(): boolean}
export interface Contribution {
 id: string;
 schema: string;
 read(binding: Binding): Json | Promise<Json>;
}
export type ReadResult = Readonly<{ok: true; value: Json; sampledAt: number; generation: number}>
 | Readonly<{ok: false; reason: 'missing' | 'stale' | 'failed' | 'invalid-value'}>;
export interface Source {
 readonly owner: string;
 readonly id: string;
 readonly schema: string;
 read(binding: Binding): Promise<ReadResult>;
}
export interface Participant {
 readonly id: string;
 mount(request: MountRequest): Readonly<MountHandle>;
 claim(kind: ResourceKind, key: string): Readonly<Claim> | null;
 provide(contribution: Contribution): Cleanup;
 dispose(): void;
}
export interface Host {
 readonly protocolVersion: typeof PROTOCOL;
 register(id: string): Readonly<Participant>;
 binding(): Binding;
 sources(schema: string): readonly Source[];
 onContributions(callback: () => void): Cleanup;
 /** Called by the SugarCube bridge on :passageinit / :onloadsave. */
 invalidateScene(): void;
 /** Called after :passageend / :storyready; never creates a game moment. */
 sceneReady(): void;
 getDiagnostics(): Readonly<{
  generation: number; disposed: boolean;
  participants: readonly string[];
  mounts: readonly Readonly<{owner: string; id: string; lifetime: Lifetime}>[];
  claims: readonly Readonly<{owner: string; kind: ResourceKind; key: string}>[];
  sources: readonly Readonly<{owner: string; id: string; schema: string}>[];
  errors: readonly Readonly<{owner: string; stage: string}>[];
 }>;
 dispose(): void;
}
declare global {interface Window {DoLUiHost?: Readonly<Host>}}
