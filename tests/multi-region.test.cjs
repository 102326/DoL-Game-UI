const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const root = __dirname;
const artifact = name => path.join(root, 'artifacts', `multi-${name}`);

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1704, height: 1136 } });
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(10000);
    await page.goto(pathToFileURL(path.join(root, 'fixture.html')).href);
    await page.waitForSelector('#listContainer');

    await page.evaluate(() => {
      const primary = document.querySelector('#listContainer');
      const paragraph = document.createElement('p');
      paragraph.id = 'multi-intervening-copy';
      paragraph.textContent = 'intervening story text remains in place';
      const secondary = document.createElement('div');
      secondary.id = 'listContainer';
      secondary.innerHTML = '<div id="extraaction"><label><input type="radio" name="extraaction" value="assist">协助</label><label><input type="radio" name="extraaction" value="retreat">撤退</label><ul class="unsupported-nested-list"><li>未知嵌套内容仍可见</li></ul></div>';
      primary.after(paragraph, secondary);
      window.multi = {
        primary,
        paragraph,
        secondary,
        paragraphParent: paragraph.parentNode,
        originalOrder: [...primary.parentNode.children].map(node => node.id || node.tagName),
        changes: 0,
        extraChanges: 0,
      };
      primary.addEventListener('change', () => window.multi.changes++);
      secondary.addEventListener('change', () => window.multi.extraChanges++);
    });
    await page.addStyleTag({ path: path.join(root, '../dist/game-ui.css') });
    await page.addScriptTag({ path: path.join(root, '../dist/game-ui.js') });
    await page.waitForSelector('.dcu-dock-native #next a');
    await page.waitForFunction(() => document.querySelectorAll('[id="listContainer"]').length === 2);

    const state = () => page.evaluate(() => {
      const lists = [...document.querySelectorAll('[id="listContainer"]')];
      const footer = document.querySelector('.dcu-footer');
      return {
        lists: lists.length,
        primaryInNative: !!document.querySelector('.dcu-root:not(.dcu-extension) .dcu-native #listContainer'),
        secondaryInExtension: !!document.querySelector('.dcu-extension .dcu-native #listContainer'),
        nextCount: document.querySelectorAll('#next').length,
        footers: document.querySelectorAll('.dcu-footer').length,
        summaryGroups: document.querySelector('.dcu-summary')?.textContent || '',
        paragraphIndex: [...document.querySelector('#multi-intervening-copy').parentNode.children].indexOf(document.querySelector('#multi-intervening-copy')),
        paragraphPreserved: document.querySelector('#multi-intervening-copy').parentNode === window.multi.paragraphParent,
        secondaryIndex: [...lists[1].parentNode.children].indexOf(lists[1]),
        nestedVisible: (() => { const node = document.querySelector('.unsupported-nested-list'); const r = node?.getBoundingClientRect(); return !!node && getComputedStyle(node).display !== 'none' && !!r && r.width > 0 && r.height > 0; })(),
        footerWidth: footer?.getBoundingClientRect().width || 0,
        viewportWidth: innerWidth,
      };
    });
    let s = await state();
    assert.equal(s.lists, 2, 'both combat regions remain present');
    assert.ok(await page.evaluate(()=>document.querySelector('.dcu-native [id="listContainer"]')===multi.primary && document.querySelector('.dcu-extension [id="listContainer"]')===multi.secondary), 'native node identity preserved');
    assert.ok(await page.evaluate(()=>!!(multi.primary.compareDocumentPosition(multi.paragraph)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(multi.paragraph.compareDocumentPosition(multi.secondary)&Node.DOCUMENT_POSITION_FOLLOWING)), 'narrative order preserved');
    assert.equal(s.primaryInNative, true, 'primary region is mounted in native host');
    assert.equal(s.secondaryInExtension, true, 'secondary region is mounted in extension host');
    assert.equal(s.nextCount, 1, 'one native continue control remains');
    assert.equal(s.footers, 1, 'one shared footer is mounted');
    assert.equal(s.nestedVisible, true, 'unsupported nested content remains visible');
    assert.equal(s.paragraphPreserved, true, 'intervening paragraph remains in its original parent');
    await page.locator('.dcu-summary-toggle').click();
    await page.waitForSelector('.dcu-summary');
    s = await state();
    assert.ok(s.summaryGroups.includes('6 组'), `summary reports all base and secondary groups: ${s.summaryGroups}`);

    await page.locator('#extraaction label').filter({ hasText: '协助' }).click();
    await page.waitForFunction(() => document.querySelector('.dcu-summary')?.textContent.includes('协助'));
    assert.equal(await page.evaluate(() => window.multi.extraChanges), 1, 'secondary native change event fires once');
    assert.equal(await page.locator('#extraaction').getAttribute('data-dcu-active'),'');
    assert.equal(await page.locator('.dcu-group[data-dcu-active]').count(),1,'focus marks only the current native region');
    await page.locator('#leftaction label').filter({ hasText: '防御' }).click();
    await page.waitForFunction(() => document.querySelector('.dcu-summary')?.textContent.includes('防御'));
    assert.equal(await page.evaluate(() => window.multi.changes), 1, 'primary native change event fires once');
    assert.equal(await page.locator('#leftaction').getAttribute('data-dcu-active'),'');
    assert.equal(await page.locator('#extraaction').getAttribute('data-dcu-active'),null);

    await page.evaluate(() => {
      const old = window.multi.secondary;
      old.remove();
    });
    await page.waitForFunction(() => document.querySelectorAll('[id="listContainer"]').length === 1 && !document.querySelector('.dcu-extension'));
    assert.equal(await page.evaluate(()=>multi.secondary.isConnected),false);
    await page.evaluate(() => {
      const replacement = document.createElement('div');
      replacement.id = 'listContainer';
      replacement.innerHTML = '<div id="replacementaction"><label><input type="radio" name="replacementaction" value="counter">反击</label></div>';
      window.multi.replacement = replacement;
      window.multi.paragraph.after(replacement);
    });
    await page.waitForFunction(() => document.querySelectorAll('[id="listContainer"]').length === 2 && !!document.querySelector('.dcu-extension #replacementaction'));
    s = await state();
    assert.equal(s.secondaryInExtension, true, 'replacement secondary region is mounted dynamically');
    assert.equal(s.nextCount, 1, 'dynamic replacement keeps one continue control');
    if (!s.summaryGroups) {
      await page.locator('.dcu-summary-toggle').click();
      await page.waitForSelector('.dcu-summary');
      s = await state();
    }
    assert.ok(s.summaryGroups.includes('6 组'), `summary recounts dynamically replaced region: ${s.summaryGroups}`);
    await page.locator('#replacementaction label').click();
    await page.waitForFunction(() => document.querySelector('.dcu-summary')?.textContent.includes('反击'));

    await page.evaluate(() => {
      const old = window.multi.replacement;
      old.remove();
    });
    await page.waitForFunction(() => document.querySelectorAll('[id="listContainer"]').length === 1 && !document.querySelector('.dcu-extension'));
    assert.equal(await page.evaluate(()=>multi.replacement.isConnected),false);
    await page.evaluate(() => {
      window.multi.secondary = document.createElement('div');
      window.multi.secondary.id = 'listContainer';
      window.multi.secondary.innerHTML = '<div id="readdedaction"><label><input type="radio" name="readdedaction" value="guard">再加入</label></div>';
      window.multi.paragraph.after(window.multi.secondary);
    });
    await page.waitForFunction(() => !!document.querySelector('.dcu-extension #readdedaction'));
    assert.equal(await page.locator('#readdedaction input').count(), 1, 'new secondary region is observed after remove/add');

    // Nested action containers are deliberately unsupported; native controls stay visible.
    await page.evaluate(()=>{const nested=document.createElement('div');nested.id='listContainer';nested.innerHTML='<label><input id="nested-native" type="radio">嵌套原生选项</label>';multi.secondary.append(nested);multi.nested=nested});
    await page.waitForFunction(()=>!document.querySelector('.dcu-shell'));
    assert.ok(await page.locator('#nested-native').isVisible());
    await page.locator('#nested-native').check();
    assert.ok(await page.locator('#nested-native').isChecked());
    await page.evaluate(()=>multi.nested.remove());
    await page.waitForSelector('.dcu-dock-native #next a');
    fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
    for (const [name, width, height] of [['tablet', 1704, 1136], ['phone', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({reducedMotion:"reduce"});
      await page.evaluate(()=>scrollTo(0,0));
      await page.waitForFunction(() => document.querySelector('.dcu-footer')?.getBoundingClientRect().right <= innerWidth + 1);
      assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.dcu-root')].every(e=>e.scrollWidth<=e.clientWidth+2)),name+' no horizontal overflow');
      await page.screenshot({ animations:"disabled", path: artifact(`${name}.png`), fullPage: true });
    }

    await page.evaluate(() => DoLGameUI.setPreference('combatEnabled', false));
    await page.waitForFunction(() => !document.querySelector('.dcu-shell'));
    s = await state();
    assert.equal(s.nextCount, 1, 'disable leaves one original continue control');
    assert.equal(await page.evaluate(() => window.multi.primary.parentNode?.classList.contains('dcu-native')), false, 'disable restores primary parent');
    assert.equal(await page.evaluate(() => window.multi.secondary.parentNode?.classList.contains('dcu-native')), false, 'disable restores secondary parent');
    assert.equal(s.paragraphPreserved, true, 'disable preserves intervening paragraph parent');

    await page.evaluate(() => DoLGameUI.setPreference('combatEnabled', true));
    await page.waitForSelector('.dcu-dock-native #next a');
    assert.equal((await state()).secondaryInExtension, true, 'reenable remounts secondary region');
    await page.evaluate(() => DoLGameUI.destroy());
    await page.waitForFunction(() => !document.querySelector('.dcu-shell'));
    const destroyed = await page.evaluate(() => ({
      roots: document.querySelectorAll('.dcu-root').length,
      footer: document.querySelectorAll('.dcu-footer').length,
      primaryParent: window.multi.primary.parentNode?.className || '',
      secondaryParent: window.multi.secondary.parentNode?.className || '',
      order: [...window.multi.paragraph.parentNode.children].map(node => node.id || node.tagName),
      nextCount: document.querySelectorAll('#next').length,
    }));
    assert.equal(destroyed.roots, 0, 'destroy removes all UI roots');
    assert.equal(destroyed.footer, 0, 'destroy removes shared footer');
    assert.equal(destroyed.nextCount, 1, 'destroy preserves one original continue control');
    assert.equal(destroyed.primaryParent.includes('dcu-native'), false, 'destroy restores primary parent');
    assert.equal(destroyed.secondaryParent.includes('dcu-native'), false, 'destroy restores secondary parent');
    assert.deepEqual(destroyed.order, await page.evaluate(() => window.multi.originalOrder), 'destroy restores original sibling ordering');
    assert.deepEqual(errors, [], 'no page errors');

    fs.writeFileSync(artifact('verification.json'), JSON.stringify({
      passed: true,
      scope: 'two combat regions, dynamic replacement, lifecycle restore, fallback content',
      errors,
      screenshots: ['multi-tablet.png', 'multi-phone.png'],
    }, null, 2));
    console.log('PASS multi-region identity, events, dynamic replacement, lifecycle restore, fallback, tablet and phone screenshots.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
