export type Mapping = {standard: string[]; research: string[]; standalone: string[]};
// shortcut: reviewed consumers are not a complete impact graph; expand only after review.
export const mappings: Record<string, Mapping> = {
 'framework/official-ui/motion.ts': {
  // Direct: official-game-motion, owner-resources; composed: settings, navigation, panels, adapter and lifecycle.
  standard: ['browser.official-game-motion.cjs', 'browser.evolution-owner-resources.cjs', 'browser.source-motion-lifecycle.cjs', 'browser.settings-ci.cjs', 'browser.evolution-navigation.cjs', 'browser.evolution-panels.cjs', 'browser.kraft-work-adapters.cjs'],
  research: ['official-game-motion', 'evolution-owner-resources', 'source-motion-lifecycle', 'settings-ci', 'evolution-navigation', 'evolution-panels'], standalone: []
 },
 'src/theme/acrylic.ts': {
  // Direct: adapter-materials; composed: theme/settings, official Hub integration and device layouts.
  standard: ['browser.attributes-material.cjs', 'browser.adapter-materials.cjs', 'browser.settings-ci.cjs', 'browser.evolution-owner-resources.cjs', 'browser.device-layouts.cjs'],
  research: ['attributes-material', 'settings-ci', 'evolution-owner-resources'],
  // Standalone: actual transparency values, controls and storage failure.
  standalone: ['tests/ui41-material.cjs']
 },
 'src/ui/golden-spin/hub-motion.ts': {
  // Composed: official Hub integration is included in owner-resources; device-layouts starts the official Hub.
  standard: ['browser.evolution-owner-resources.cjs', 'browser.device-layouts.cjs'],
  research: ['evolution-owner-resources'], standalone: []
 }
};
