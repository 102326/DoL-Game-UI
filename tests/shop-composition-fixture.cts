// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
// Neutral shop fixture: scripted composition events are not an operating-system IME.
import assert = require('node:assert/strict');
import playwright = require('playwright');
const { chromium } = playwright;
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
declare const fixtureHost: ReturnType<typeof import('../framework/host').createHost>,
  fixtureUi: ReturnType<typeof import('../src/shop/main').startShop>;
declare global {
  interface Window {
    events: Array<{ name: string; generation: number }>;
    generation: number;
    template: string;
    timer: ReturnType<typeof setTimeout>;
    redirectFocus: boolean;
    redirectOnBlur: boolean;
    fixtureHost: typeof fixtureHost;
    fixtureUi: typeof fixtureUi;
  }
}
function must<T>(v: T | null | undefined): T {
  if (v == null) throw Error('Missing shop fixture');
  return v;
}
async function checkShortViewport(page: playwright.Page) {
  const shop = page.locator('#clothingShop-div');
  const drawer = shop.locator('.clothing-details');
  const item = shop.locator('.dgshop-selected a');
  const note = drawer.getByLabel('Note');
  const search = shop.locator('#textbox--shopnamefiltertextbox');
  const selection = (field: playwright.Locator) => field.evaluate(node => {
    if (!(node instanceof HTMLInputElement)) throw Error('Expected native input');
    return [document.activeElement === node, node.value, node.selectionStart, node.selectionEnd];
  });
  async function resize(width: number, height: number, short: boolean) {
    await page.setViewportSize({width, height});
    await page.waitForFunction(({width, height, short}) => {
      const n = document.querySelector<HTMLElement>('#clothingShop-div');
      return innerWidth === width && innerHeight === height && visualViewport?.height === height &&
        n?.style.getPropertyValue('--dgshop-visual-height') === height + 'px' &&
        n.classList.contains('dgshop-short') === short;
    }, {width, height, short});
  }
  await shop.evaluate(n => n.style.setProperty('--dgu-font-scale', '1.2'));
  await resize(390, 700, false);
  const selectedTitle = await item.innerText();
  await note.fill('example');
  await page.keyboard.press('Control+a');
  for (const height of [501, 499, 444]) {
    await resize(390, height, false);
    assert.deepEqual(await selection(note), [true, 'example', 0, 7]);
    assert.ok(await drawer.evaluate(n => n.matches(':popover-open')));
  }
  const metrics = await page.context().newCDPSession(page);
  try {
    for (const [width, height, angle, type] of [
      [915, 412, 90, 'landscapePrimary'], [390, 700, 0, 'portraitPrimary'],
    ] as const) {
      await metrics.send('Emulation.setDeviceMetricsOverride', {
        width, height, mobile:false, deviceScaleFactor:1, screenOrientation:{type, angle},
      });
      await page.waitForFunction(({width, height, angle}) =>
        innerWidth === width && innerHeight === height && screen.orientation.angle === angle &&
        visualViewport?.height === height &&
        document.querySelector<HTMLElement>('#clothingShop-div')?.style.getPropertyValue('--dgshop-visual-height') === height + 'px',
        {width, height, angle});
      assert.equal(await shop.evaluate(n => n.classList.contains('dgshop-short')), angle === 90);
      assert.equal(await drawer.evaluate(n => n.matches(':popover-open')), angle === 0);
      assert.ok(await drawer.isVisible());
      assert.deepEqual(await selection(note), [true, 'example', 0, 7]);
      assert.equal(await item.innerText(), selectedTitle);
    }
  } finally {
    await metrics.send('Emulation.clearDeviceMetricsOverride');
    await metrics.detach();
  }
  await resize(390, 700, false);
  await resize(390, 444, false);
  await page.keyboard.press('Control+Escape');
  assert.deepEqual(await selection(note), [true, 'example', 0, 7], 'modified Escape belongs to the editor/system');
  // These synthetic key events distinguish IME ownership and an editor which consumed Escape.
  for (const flags of [{isComposing:true}, {keyCode:229}, {defaultPrevented:true}]) {
    await note.evaluate((n, flags) => {
      const key = new KeyboardEvent('keydown', {key:'Escape', bubbles:true, cancelable:true, ...flags});
      if (flags.defaultPrevented) key.preventDefault();
      n.dispatchEvent(key);
    }, flags);
    assert.deepEqual(await selection(note), [true, 'example', 0, 7]);
    assert.ok(await drawer.evaluate(n => n.matches(':popover-open')));
  }
  await page.keyboard.press('Escape');
  assert.ok(await item.evaluate(n => n === document.activeElement), 'plain Escape returns to the selected item');
  assert.equal(await item.innerText(), selectedTitle);
  assert.ok(!await drawer.evaluate(n => n.matches(':popover-open')));
  await resize(390, 700, false);
  await search.focus();
  await page.keyboard.press('Control+a');
  const value = await search.inputValue();
  assert.ok(value.length > 0);
  for (const height of [500, 499, 444, 700]) {
    await resize(390, height, false);
    assert.deepEqual(await selection(search), [true, value, 0, value.length]);
  }
  await page.keyboard.press('Tab');
  assert.ok(!await search.evaluate(n => n === document.activeElement));
  await resize(390, 500, false);
  await resize(390, 499, true);
  await resize(390, 444, true);
  assert.ok(!await drawer.evaluate(n => n.matches(':popover-open')));
  await shop.evaluate(n => n.style.removeProperty('--dgu-font-scale'));
  await resize(1100, 800, false);
}
(async () => {
  const [{ createServer }, { default: vue }] = await Promise.all([import('vite'), import('@vitejs/plugin-vue')]);

  const server = await createServer({
    configFile: false,
    plugins: [
      vue(),
      {
        name: 'shop-input-fixture',
        configureServer(s) {
          s.middlewares.use('/__shop_input__', (_q, r) => {
            r.setHeader('Content-Type', 'text/html');
            r.end('<!doctype html><html><body></body></html>');
          });
        },
      },
    ],
    optimizeDeps: { noDiscovery: true, include: ['vue'] },
    server: { host: '127.0.0.1', port: 0 },
    logLevel: 'error',
  });
  const browser = await chromium.launch(browserOptions);
  try {
    await server.listen();
    const address = server.httpServer?.address();
    assert.ok(address && typeof address !== 'string');
    for (const arm of ['native', 'host', 'ui', 'ui-fallback']) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      if (arm === 'ui-fallback')
        await page.addInitScript(() => {
          Object.defineProperty(Element.prototype, 'moveBefore', { configurable: true, value: undefined });
        });
      await page.goto(`http://127.0.0.1:${address.port}/__shop_input__`);
      await page.evaluate(() =>
        Object.assign(window, {
          must: <T,>(v: T | null | undefined) => {
            if (v == null) throw Error('Missing shop fixture');
            return v;
          },
        }),
      );
      await page.evaluate(async (arm) => {
        document.body.innerHTML = `<div id="passages"><div class="passage" data-passage="Clothing Shop"><div id="clothingShop-div"><div id="clothes-list"><div class="optionsBar"><div class="searchGroup"><label class="searchBar">Search <input id="textbox--shopnamefiltertextbox" type="text"></label></div></div><div id="shop-list-pages">${Array.from({ length: 40 }, (_, i) => `<div class="clothing-item"><span class="clothing-name"><a class="link-internal" tabindex="0">Item ${i}</a></span></div>`).join('')}</div><div class="clothing-details"><p>Fixture detail</p><label>Note <input type="text"></label><div class="buy-buttons"><a class="link-internal" tabindex="0">Buy</a></div></div></div></div></div></div>`;
        Object.assign(window, {
          SugarCube: {
            State: {
              passage: 'Clothing Shop',
              variables: { money: 1000, clothingShopSlot: 'upper', clothes_choice: 0 },
            },
          },
          setup: { clothes: { upper: [{}] } },
        });
        window.events = [];
        window.generation = 0;
        window.template = must(document.querySelector('#clothes-list')).outerHTML;
        document.body.insertAdjacentHTML('beforeend', '<button id=outside>Outside</button>');
        const bind = (input: HTMLInputElement) => {
          input.addEventListener('blur', () => {
            if (window.redirectOnBlur) must(document.querySelector<HTMLElement>('#outside')).focus();
          });
          input.addEventListener('input', () => {
            clearTimeout(window.timer);
            const value = input.value;
            window.timer = setTimeout(() => {
              const shop = must(document.querySelector<HTMLElement>('#clothingShop-div'));
              shop.innerHTML = window.template;
              const next = must(shop.querySelector<HTMLInputElement>('#textbox--shopnamefiltertextbox'));
              next.value = value;
              window.generation++;
              bind(next);
              next.focus();
              if (window.redirectFocus) must(document.querySelector<HTMLElement>('#outside')).focus();
            }, 300);
          });
        };
        document.addEventListener('focusin', (e) => {
          if (e.target instanceof HTMLElement && e.target.id === 'textbox--shopnamefiltertextbox')
            window.events.push({ name: 'focus', generation: window.generation });
        });
        document.addEventListener('focusout', (e) => {
          if (e.target instanceof HTMLElement && e.target.id === 'textbox--shopnamefiltertextbox')
            window.events.push({ name: 'blur', generation: window.generation });
        });
        bind(must(document.querySelector<HTMLInputElement>('#textbox--shopnamefiltertextbox')));
        if (arm !== 'native') {
          const { createHost } = await import('/framework/host.ts');
          window.fixtureHost = createHost(window);
          if (arm.startsWith('ui')) {
            const { startShop } = await import('/src/shop/main.ts');
            window.fixtureUi = startShop(window, {
              host: window.fixtureHost,
              owner: window.fixtureHost.register('ShopFixture'),
            });
          }
        }
      }, arm);
      if (arm.startsWith('ui')) await page.locator('.dgshop-catalog').waitFor();
      const input = page.locator('#textbox--shopnamefiltertextbox');
      const waitReplacement = async (previous: number) => {
        await page.waitForFunction((n) => window.generation > n, previous);
        if (arm.startsWith('ui'))
          await page.locator('.dgshop-browse-tools #textbox--shopnamefiltertextbox').waitFor();
      };
      const resize = async (width: number) => {
        await page.setViewportSize({ width, height: 800 });
        if (arm.startsWith('ui'))
          await page.waitForFunction(
            (n) =>
              document.querySelector('#clothingShop-div')?.classList.contains('dgshop-narrow') === (n === 420),
            width,
          );
        else await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
      };
      await input.focus();
      let generation = await page.evaluate(() => window.generation);
      await page.keyboard.type('abc');
      await waitReplacement(generation);
      if (arm === 'ui' && await page.evaluate(() => 'moveBefore' in Element.prototype)) {
        assert.equal(
          await page.evaluate(() => window.events.filter(e => e.generation === window.generation && e.name === 'blur').length),
          0, 'projecting the refocused search field must not interrupt the IME',
        );
      }
      let state = await input.evaluate((n) => {
        if (!(n instanceof HTMLInputElement)) throw Error('Missing input');
        return { focus: document.activeElement === n, value: n.value, caret: n.selectionStart };
      });
      assert.equal(
        state.focus,
        true,
        `${arm} ordinary after native replacement: ${JSON.stringify(state)} events=${JSON.stringify(await page.evaluate(() => window.events))}`,
      );
      assert.equal(state.value, 'abc');
      for (const [result, expected] of [
        ['commit', 'abc中文'],
        ['cancel', 'abc中文'],
      ]) {
        generation = await page.evaluate(() => window.generation);
        await page.evaluate((result) => {
          const n = must(document.querySelector<HTMLInputElement>('#textbox--shopnamefiltertextbox'));
          n.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
          n.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: 'zhong' }));
          n.value += 'zhong';
          n.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              data: 'zhong',
              inputType: 'insertCompositionText',
              isComposing: true,
            }),
          );
          if (result === 'commit') {
            n.value = n.value.slice(0, -5) + '中文';
            n.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '中文' }));
            n.dispatchEvent(new InputEvent('input', { bubbles: true, data: '中文', inputType: 'insertText' }));
          } else {
            n.value = n.value.slice(0, -5);
            n.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }));
            n.dispatchEvent(
              new InputEvent('input', { bubbles: true, data: null, inputType: 'deleteCompositionText' }),
            );
          }
        }, result);
        await waitReplacement(generation);
        state = await input.evaluate((n) => {
          if (!(n instanceof HTMLInputElement)) throw Error('Missing input');
          return { focus: document.activeElement === n, value: n.value, caret: n.selectionStart };
        });
        assert.equal(state.focus, true, `${arm} ${result} after native replacement`);
        assert.equal(state.value, expected);
      }
      await input.focus();
      generation = await page.evaluate(() => window.generation);
      await page.evaluate(() => {
        window.redirectFocus = true;
        const n = must(document.querySelector<HTMLInputElement>('#textbox--shopnamefiltertextbox'));
        n.dispatchEvent(new InputEvent('input', { bubbles: true }));
      });
      await waitReplacement(generation);
      assert.equal(
        await page.evaluate(() => document.activeElement?.id),
        'outside',
        `${arm} must not reclaim focus after native callback`,
      );
      await page.evaluate(() => {
        window.redirectFocus = false;
      });
      await input.focus();
      await input.evaluate((n) => {
        if (!(n instanceof HTMLInputElement)) throw Error('Missing input');
        n.setSelectionRange(1, 1);
      });
      for (const width of [420, 1100]) {
        await resize(width);
        assert.equal(
          await input.evaluate(
            (n) => n instanceof HTMLInputElement && document.activeElement === n && n.selectionStart === 1,
          ),
          true,
          `${arm} resize ${width}`,
        );
      }
      if (arm.startsWith('ui')) {
        await page.locator('.clothing-item a').first().click();
        await page.waitForFunction(() =>
          document.querySelector('.clothing-details')?.classList.contains('dgshop-detail-open'),
        );
        const detail = page.locator('.buy-buttons a');
        await detail.focus();
        assert.equal(await detail.evaluate((n) => document.activeElement === n), true, 'detail initially focused');
        for (const width of [420, 1100]) {
          await resize(width);
          assert.equal(
            await detail.evaluate((n) => document.activeElement === n),
            true,
            `UI detail focus after resize ${width}: ${JSON.stringify(await page.evaluate(() => ({ active: document.activeElement?.outerHTML, detail: document.querySelector('.clothing-details')?.outerHTML.slice(0, 600) })))}`,
          );
        }
      }
      if (arm === 'ui') await checkShortViewport(page);
      await input.focus();
      if (arm === 'ui-fallback') {
        generation = await page.evaluate(() => window.generation);
        await page.evaluate(() => {
          window.redirectOnBlur = true;
          const n = must(document.querySelector<HTMLInputElement>('#textbox--shopnamefiltertextbox'));
          n.dispatchEvent(new InputEvent('input', { bubbles: true }));
        });
        await waitReplacement(generation);
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          'outside',
          'fallback must honor blur handler focusing another control',
        );
        await page.evaluate(() => {
          window.redirectOnBlur = false;
        });
        await input.focus();
      }
      // A preedit that lasts beyond the native debounce is replaced in every arm.
      const longPreedit = await input.elementHandle();
      generation = await page.evaluate(() => window.generation);
      await page.evaluate(() => {
        const n = must(document.querySelector<HTMLInputElement>('#textbox--shopnamefiltertextbox'));
        n.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        n.value += 'x';
        n.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            data: 'x',
            inputType: 'insertCompositionText',
            isComposing: true,
          }),
        );
      });
      await waitReplacement(generation);
      assert.equal(
        await must(longPreedit).evaluate((n) => n.isConnected),
        false,
        `${arm} native debounce replaces long preedit input`,
      );
      await must(longPreedit).dispose();
      if (arm.startsWith('ui')) {
        const catalog = page.locator('.dgshop-catalog');
        await catalog.evaluate((n) => {
          n.style.height = '100px';
          n.style.overflow = 'auto';
          n.scrollTop = 100;
        });
        const before = await catalog.evaluate((n) => n.scrollTop);
        assert.ok(before > 0, 'the fixture must actually scroll before the result mutation');
        await page.evaluate(() => {
          const pages = must(document.querySelector('#shop-list-pages'));
          pages.append(document.createElement('span'));
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
        );
        assert.equal(
          await catalog.evaluate((n) => n.scrollTop),
          before,
          'UI preserves catalog scroll across result mutation',
        );
      }
      if (arm.startsWith('ui')) {
        await input.focus();
        const before = await input.elementHandle();
        await page.evaluate(() => fixtureUi.setEnabled(false));
        assert.equal(
          await input.evaluate((n) => document.activeElement === n),
          true,
          'disabling UI preserves focused input',
        );
        assert.equal(
          await must(before).evaluate((n) => n.isConnected),
          true,
          'disabling UI restores same native input',
        );
        await must(before).dispose();
        await page.locator('#outside').focus();
        await page.evaluate(() => fixtureUi.setEnabled(true));
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          'outside',
          'enabling UI does not steal external focus',
        );
      }
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${arm}: ordinary input, synthetic composition commit/cancel, focus/caret and two viewport directions`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((e) => {
  receipt.terminalFailure(e);
  process.exitCode = 1;
});
