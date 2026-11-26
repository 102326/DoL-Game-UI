import assert from 'node:assert/strict';
import type {Page} from 'playwright';

// Call on an already-loaded, isolated page with the workspace and views installed.
export async function checkWorkspaceReversal(page: Page, title = '信息工作台') {
 const opener = page.getByRole('button', {name: title, exact: true});
 const dialog = opener.locator('..').locator('dialog');
 const close = dialog.getByRole('button', {name: '关闭', exact: true});
 const baseline = await page.evaluate(() => window.DoLUiHost!.getDiagnostics());
 const reducedBefore = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
 assert.equal(baseline.claims.some(c => c.kind === 'modal' && c.key === 'foreground'), false);
 const settled = async () => page.waitForFunction((name) => {
  const el = [...document.querySelectorAll('dialog')].find(d => d.getAttribute('aria-label') === name);
  return !!el?.open && el.getAnimations().length === 0;
 }, title);
 const closed = async () => {
  await dialog.waitFor({state: 'hidden'});
  await page.waitForFunction(({mounts, claims}) => {
   const d = window.DoLUiHost!.getDiagnostics();
   return JSON.stringify(d.mounts) === JSON.stringify(mounts) && JSON.stringify(d.claims) === JSON.stringify(claims);
  }, {mounts: baseline.mounts, claims: baseline.claims});
  assert.ok(await opener.evaluate(el => el === document.activeElement), 'focus returned to opener');
 };
 try {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await opener.click();
  await dialog.locator('canvas').first().waitFor({state: 'visible'});
  await settled();
  const mounted = await page.evaluate(() => window.DoLUiHost!.getDiagnostics());
  assert.ok(mounted.claims.some(c => c.kind === 'modal' && c.key === 'foreground'));
  assert.ok(mounted.mounts.length > baseline.mounts.length, 'workspace has transient mounts');
  // Capture actual nodes, not merely selectors or generated names.
  await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__reversalNodes?: Element[]};
   d.__reversalNodes = [d, ...d.querySelectorAll('canvas')];
  });
  await close.click();
  const first = await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__reversalAnimation?: Animation};
   const a = d.getAnimations()[0];
   if (!a) throw new Error('close did not start a dialog animation');
   a.currentTime = 90;
   d.__reversalAnimation = a;
   return {time: Number(a.currentTime), rate: a.playbackRate, open: d.open,
    focusInside: d.contains(document.activeElement), claims: window.DoLUiHost!.getDiagnostics().claims};
  });
  assert.ok(first.open && first.focusInside, 'dialog and focus remain during exit');
  assert.ok(first.claims.some(c => c.kind === 'modal' && c.key === 'foreground'));
  assert.ok(first.rate < 0, 'closing timeline runs backwards');
  const stillClosing = await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__reversalAnimation?: Animation};
   const a = d.__reversalAnimation!; a.currentTime = 90; d.dispatchEvent(new Event('cancel', {cancelable:true}));
   return d.getAnimations()[0] === a && a.playbackRate < 0;
  });
  assert.ok(stillClosing, 'native cancel while exiting does not reopen');
  // Native keyboard event targets the already-focused close button; no focus is forced.
  await page.keyboard.press('k');
  const reversed = await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__reversalAnimation?: Animation; __reversalNodes?: Element[]};
   const a = d.getAnimations()[0];
   return {same: a === d.__reversalAnimation, time: Number(a?.currentTime), rate: a?.playbackRate,
    nodes: [d, ...d.querySelectorAll('canvas')].every((node, i) => node === d.__reversalNodes?.[i]) &&
      d.querySelectorAll('canvas').length + 1 === d.__reversalNodes?.length,
    mounts: window.DoLUiHost!.getDiagnostics().mounts};
  });
  assert.ok(reversed.same && reversed.rate! > 0 && reversed.time > 0 && reversed.time < 180, 'k reverses the same in-flight timeline');
  assert.ok(reversed.nodes, 'dialog and canvas identity survive reversal');
  assert.deepEqual(reversed.mounts, mounted.mounts, 'host mounts survive reversal');
  // Synchronously seek and toggle repeatedly, so no frame or timer can mask a restart.
  const turns = await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__reversalAnimation?: Animation; __reversalNodes?: Element[]};
   const a = d.__reversalAnimation!;
   const results: {same: boolean; before: number; after: number; rate: number; nodes: boolean; sameStyle: boolean}[] = [];
   for (const time of [65, 115, 75, 105]) {
    a.currentTime = time;
    const before = Number(a.currentTime);
    const {opacity, transform} = getComputedStyle(d);
    d.querySelector('header button')!.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    const current = d.getAnimations()[0];
    results.push({same: current === a, before, after: Number(current?.currentTime), rate: current?.playbackRate ?? 0,
     sameStyle: opacity === getComputedStyle(d).opacity && transform === getComputedStyle(d).transform,
     nodes: [d, ...d.querySelectorAll('canvas')].every((node, i) => node === d.__reversalNodes?.[i])});
   }
   return results;
  });
  for (const [i, turn] of turns.entries()) {
   assert.ok(turn.same && turn.nodes && turn.sameStyle && Math.abs(turn.after - turn.before) < 2, 'reversal keeps timeline position and DOM');
   assert.ok(i % 2 === 0 ? turn.rate < 0 : turn.rate > 0, 'each toggle changes direction');
  }
  await settled();
  assert.deepEqual((await page.evaluate(() => window.DoLUiHost!.getDiagnostics())).mounts, mounted.mounts);
  await page.keyboard.press('Escape');
  await closed();

  // Reduced motion is checked both initially and while an exit is active.
  await page.emulateMedia({reducedMotion: 'reduce'});
  await opener.click();
  assert.equal(await dialog.evaluate(el => el.getAnimations().length), 0);
  await close.click();
  await closed();
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await opener.click();
  await settled();
  await close.click();
  assert.ok(await dialog.evaluate(el => el.getAnimations().length > 0));
  // Hold the clock mid-exit: only the preference-change handler can finish this close.
  await dialog.evaluate(el => {
   const animation = el.getAnimations()[0]!;
   animation.pause();
   animation.currentTime = 90;
  });
  await page.emulateMedia({reducedMotion: 'reduce'});
  await closed();

  // Shadow the API on this dialog only, leaving other consumers untouched.
  await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__workspaceAnimate?: PropertyDescriptor};
   d.__workspaceAnimate = Object.getOwnPropertyDescriptor(d, 'animate');
   Object.defineProperty(d, 'animate', {configurable: true, writable: true, value: undefined});
  });
  try {
   await page.emulateMedia({reducedMotion: 'no-preference'});
   await opener.click();
   assert.equal(await dialog.evaluate(el => el.getAnimations().length), 0);
   await close.click();
   await closed();
  } finally {
   await dialog.evaluate(el => {
    const d = el as HTMLDialogElement & {__workspaceAnimate?: PropertyDescriptor};
    if (d.__workspaceAnimate) Object.defineProperty(d, 'animate', d.__workspaceAnimate);
    else delete (d as Partial<HTMLDialogElement>).animate;
    delete d.__workspaceAnimate;
   });
  }
  assert.deepEqual((await page.evaluate(() => window.DoLUiHost!.getDiagnostics())).errors, baseline.errors);
  return {nativeKeyboardReversal: true, repeatedReversals: turns.length, samples: turns.map(({before,after,rate}) => ({before,after,rate})), preservedNodes: true,
   preservedMountsAndModal: true, reducedMotion: true, missingAnimate: true, finalFocusRestored: true};
 } finally {
  await dialog.evaluate(el => {
   const d = el as HTMLDialogElement & {__reversalAnimation?: Animation; __reversalNodes?: Element[]};
   delete d.__reversalAnimation;
   delete d.__reversalNodes;
  });
  await page.emulateMedia({reducedMotion: reducedBefore ? 'reduce' : 'no-preference'});
 }
}
