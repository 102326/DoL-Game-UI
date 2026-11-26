import assert from 'node:assert/strict';
import type {Page} from 'playwright';

export async function checkRealWorkspace(page:Page, observatory:boolean, title = '信息工作台') {
  const opener=page.getByRole('button',{name:title,exact:true});
  const dialog=page.getByRole('dialog',{name:title});
  await opener.click();
  const direct=dialog.locator('[data-view="Host5Atmosphere:surface"]');
  const embedded=dialog.locator('[data-view="Host5Observatory:observatory"]');
  await direct.locator('canvas').waitFor({state:'visible'});
  assert.equal(await embedded.count(),Number(observatory));
  if(observatory){
    await embedded.getByRole('button',{name:'雨',exact:true}).click();
    await embedded.getByRole('button',{name:'雪',exact:true}).click();
    await Promise.all([direct,embedded].map(el=>el.locator('[data-weather="snow"] canvas').waitFor({state:'visible'})));
  } else {
    // With the controller Mod uninstalled, operate the remaining consumer's actual drag handle.
    const handle=direct.locator('.ability');
    const box=await handle.boundingBox();
    assert.ok(box);
    const x=box.x+box.width/2, y=box.y+box.height/2;
    await page.mouse.move(x,y);await page.mouse.down();
    try{
      await page.mouse.move(x+30,y);
      assert.ok(Number(await direct.locator('.effects-surface').getAttribute('data-shift'))>10);
    } finally {await page.mouse.up()}
  }
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  assert.ok(await opener.evaluate(el=>el===document.activeElement));
  await opener.click();
  await direct.locator(observatory?'[data-weather="snow"] canvas':'canvas').waitFor({state:'visible'});
  if(observatory)await embedded.locator('[data-weather="snow"] canvas').waitFor({state:'visible'});
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();
  await page.waitForFunction(()=>!window.DoLUiHost!.getDiagnostics().mounts.some(m=>m.owner.startsWith('AtmosphereSurface')));
  assert.deepEqual(await page.evaluate(()=>window.DoLUiHost!.getDiagnostics().errors),[]);
  return {surfaces:observatory?2:1,action:observatory?'weather command changes both views':'remaining view accepts drag',
    closeReopen:true,focusRestored:true,liveSurfacesAfterClose:0};
}
