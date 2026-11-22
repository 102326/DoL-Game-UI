import {createHost} from '../../../framework/host';
import {createWeather, mountEffects} from './effects';
import './style.css';
import './demo.css';
const host = createHost(window);
const shared = createWeather(host);
const page = mountEffects(host, 'EffectsPage', document.querySelector<HTMLElement>('#page')!, shared);
let panel: ReturnType<typeof mountEffects> | undefined = mountEffects(host, 'EffectsPanel', document.querySelector<HTMLElement>('#panel')!, shared);
document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(button => button.addEventListener('click', () => shared.set(button.dataset.weather as 'sunny' | 'rain' | 'snow')));
let sceneIndex = 0;
const sceneContent = document.querySelector<HTMLElement>('#scene-content')!;
function renderScene() {
 sceneContent.innerHTML = sceneIndex === 0
  ? '<article data-page="one"><h2>Page one</h2><p>A quiet room.</p><button type="button" class="background-action">Activate page control</button><output>0</output></article>'
  : '<article data-page="two"><h2>Page two</h2><ul><li>A different scene</li></ul><button type="button" class="background-action">Activate page control</button><output>0</output></article>';
 const output = sceneContent.querySelector('output')!;
 sceneContent.querySelector('button')!.addEventListener('click', () => {output.textContent = String(Number(output.textContent) + 1)});
}
renderScene();
document.querySelector('#scene')!.addEventListener('click', () => {host.invalidateScene(); sceneIndex = 1 - sceneIndex; renderScene(); host.sceneReady()});
document.querySelector('#remove-panel')!.addEventListener('click', () => {const restoreFocus = document.querySelector('#panel')!.contains(document.activeElement); panel?.dispose(); panel = undefined; if (restoreFocus) document.querySelector<HTMLButtonElement>('#open-panel')!.focus()});
document.querySelector('#open-panel')!.addEventListener('click', () => {if (!panel) panel = mountEffects(host, 'EffectsPanel', document.querySelector<HTMLElement>('#panel')!, shared)});
document.querySelector('#dispose')!.addEventListener('click', () => {page.dispose(); panel?.dispose(); shared.dispose(); host.dispose()});
Object.assign(window, {effectsDemo: {host, shared, page}});
