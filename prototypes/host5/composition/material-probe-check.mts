import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser = await chromium.launch({channel: 'chrome'});
try {
  let referenceSize: number[] | undefined;
  for (const mode of ['live', 'static']) {
    const page = await browser.newPage({viewport: {width: 900, height: 820}, reducedMotion: 'no-preference'});
    const url = new URL('../../../tests/artifacts/host5-acrylic-ab/index.html', import.meta.url);
    url.searchParams.set('material', mode);
    await page.goto(url.href);
    for (const open of [true, false]) {
      const receipt = page.waitForEvent('console', {
        predicate: msg => /^SW41 .*"event":"(?:invalid|action)"/.test(msg.text()), timeout: 3000
      });
      await page.locator('#toggle').click();
      const row = JSON.parse((await receipt).text().slice(5));
      assert.equal(row.event, 'action', JSON.stringify(row));
      assert.equal(row.mode, mode);
      assert.equal(row.open, open);
      assert.equal(row.filter, mode === 'live' ? 'blur(8px)' : 'none');
      referenceSize ??= row.size;
      assert.deepEqual(row.size, referenceSize);
      assert.ok(row.intervalsMs.length && row.intervalsMs.every((ms: number) => ms > 0));
    }
    await page.close();
  }
  console.log(browser.version(), 'both materials: trusted open and close, matching geometry');
} finally {await browser.close()}
