import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {buildSync} from 'esbuild';
import {positionKey as legacyKey} from '../framework/motion-hub/geometry.ts';

type PositionExports = typeof import('../framework/motion-hub/direct-position.ts');
function positionExports(value:unknown):value is PositionExports {
 return !!value && typeof value === 'object' && 'positionKey' in value && typeof value.positionKey === 'string'
  && 'canPersist' in value && typeof value.canPersist === 'function'
  && 'initialPosition' in value && typeof value.initialPosition === 'function'
  && 'locate' in value && typeof value.locate === 'function'
  && 'readPosition' in value && typeof value.readPosition === 'function'
  && 'savePosition' in value && typeof value.savePosition === 'function';
}
const outputDir = resolve('tests/artifacts/ui42/hub-placement');
mkdirSync(outputDir, {recursive:true});
const outputFile = resolve(outputDir, `direct-position-${process.pid}.cjs`);
buildSync({entryPoints:['framework/motion-hub/direct-position.ts'], bundle:true, platform:'node', format:'cjs', outfile:outputFile});
const positionModule:unknown = createRequire(import.meta.url)(outputFile);
assert.ok(positionExports(positionModule));
const {canPersist, initialPosition, locate, positionKey, readPosition, savePosition} = positionModule;

const storage = new Map<string, string>();
const area = {left: 10, top: 20, width: 400, height: 600};
const legacy = JSON.stringify({side: 'left', y: .42, docked: false});
storage.set(legacyKey, legacy);
assert.equal(positionKey, 'SoftWet.MotionHub.freePosition.v1');
assert.equal(legacyKey, 'StoneFreeMotionHub.position.v1');
assert.deepEqual(readPosition(storage.get(positionKey) ?? null, storage.get(legacyKey) ?? null),
 {version: 1, x: 0, y: .42, docked: false, side: 'left'});
const saved = savePosition({x: 200, y: 300}, area, false);
storage.set(positionKey, JSON.stringify(saved));
assert.deepEqual(readPosition(storage.get(positionKey) ?? null, legacy), saved);
assert.deepEqual(locate(saved, area), {x: 200, y: 300});
assert.equal(storage.get(legacyKey), legacy);
assert.deepEqual(readPosition('{bad', legacy), {version: 1, x: 0, y: .42, docked: false, side: 'left'});
assert.deepEqual(readPosition('{"version":1,"x":1e999,"y":0}', legacy), readPosition(null, legacy));
assert.deepEqual(readPosition(null, null), initialPosition());
assert.deepEqual(readPosition('{"version":1,"x":2,"y":-1,"docked":false,"side":"right"}', legacy),
 {version: 1, x: 1, y: 0, docked: false, side: 'right'});
assert.deepEqual(savePosition({x: -100, y: 9999}, area, false),
 {version: 1, x: 0, y: 1, docked: false, side: 'left'});
assert.ok(Number.isFinite(locate(saved, {left: 0, top: 0, width: 20, height: 20}).x));
const future = '{"version":9,"x":0}';
storage.set(positionKey, future);
if (canPersist(storage.get(positionKey) ?? null)) storage.set(positionKey, JSON.stringify(saved));
assert.equal(storage.get(positionKey), future);
assert.equal(canPersist(null), true);
assert.equal(canPersist('{bad'), true);
assert.equal(canPersist(JSON.stringify(saved)), true);
console.log('Hub placement persistence checks passed');
