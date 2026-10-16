import type {Host, Json} from '../contracts';

type StateSource = Window & {SugarCube?: {State?: {variables?: Record<string, unknown>}}; State?: {variables?: Record<string, unknown>}};
/** Domain projection: fresh native values on every read, no business commands. */
export function provideNativeStatus(host: Host, root: StateSource, ownerId = 'NativeStatus') {
 const participant = host.register(ownerId);
 try {participant.provide({id: 'player-status', schema: 'dol.status.experimental', read(binding) {
  if (!binding.isCurrent()) throw new Error('Scene not ready');
  const variables = root.SugarCube?.State?.variables ?? root.State?.variables;
  const values: {[key: string]: Json} = {};
  for (const field of ['pain', 'stress', 'tiredness']) {
   try {
    const value = variables?.[field];
    values[field] = typeof value === 'number' && Number.isFinite(value) ? value : null;
   } catch {values[field] = null}
  }
  return values;
 }});} catch (error) {participant.dispose(); throw error}
 return participant;
}
