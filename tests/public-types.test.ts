import type {UiApi, StyleAdapter} from '../src/public/ui';

// Compile-only consumer: invalid contracts must fail without touching runtime state.
declare const ui: Readonly<UiApi>;
declare const adapter: StyleAdapter;
ui.registerStyleAdapter(adapter);
ui.openDrawer({id: 'Example', title: 'Example', content: document.createElement('div')});
// @ts-expect-error Unknown roles require a public contract change.
adapter.roles.push({role: 'invented-role', selectors: ['#example']});
// @ts-expect-error Diagnostics are read-only; consumers cannot change runtime status.
ui.getDiagnostics().adapters[0].status = 'active';
// @ts-expect-error A surface requires a real HTMLElement, not arbitrary external data.
ui.openModal({id: 'Example', title: 'Example', content: {}});
