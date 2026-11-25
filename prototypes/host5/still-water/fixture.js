(() => {
 const pause = () => new Promise(resolve => setTimeout(resolve, 120));
 async function changeColors(mode) {
  const dialog = document.querySelector('#dol-midnight-controls');
  const wasOpen = dialog?.open;
  if (!wasOpen) document.querySelector('#dol-midnight-sidebar-button').click();
  await pause();
  const button = name => [...dialog.querySelectorAll('button')].find(b => b.textContent.trim() === name);
  button('材质').click();
  await pause();
  if (mode === 'shared') {
   const values = {'界面底色':'#1b2025','面板':'#253039','主要文字':'#e4e8eb','次要文字':'#aeb9be','强调色':'#92bad5'};
   for (const [name, value] of Object.entries(values)) {
    const label = [...dialog.querySelectorAll('label')].find(l => l.querySelector('span')?.textContent.trim() === name);
    const input = label.querySelector('input[type=color]');
    input.value = value; input.dispatchEvent(new Event('input', {bubbles:true}));
   }
   await pause();
   button('应用并保存').click();
  } else button('恢复默认外观').click();
  await pause();
  if (!wasOpen) button('关闭').click();
  await pause();
  parent.postMessage({type:'sync-colors-result', mode, applied:document.documentElement.getAttribute('data-sw-custom-colors') !== null}, '*');
 }
 window.addEventListener('message', event => {
  if (event.source === parent && event.data?.type === 'sync-colors') {
   changeColors(event.data.mode).catch(error => parent.postMessage({type:'sync-colors-error',message:error.message}, '*'));
  }
  if (event.source === parent && event.data?.type === 'sync-glass') {
   window.DoLGameUI?.setPreference('visualGlass', Boolean(event.data.enabled));
  }
 });
 const vars = {money: 10000, clothingShopSlot: 'upper', clothes_choice: 0};
 Object.assign(window, {
  SugarCube: {State: {passage: 'Neutral', variables: vars}},
  setup: {clothes: {upper: Array.from({length: 12}, () => ({}))}}
 });
 const status = document.querySelector('#native-status');
 document.querySelector('#ui-bar-toggle').onclick = () => {
  document.querySelector('#ui-bar').classList.toggle('stowed');
 };
 document.querySelectorAll('#overlayButtons button').forEach(button => {
  button.addEventListener('click', () => { status.textContent = button.textContent + '：中性操作已触发'; });
 });
 document.querySelector('#next').onclick = event => {
  event.preventDefault();
  event.currentTarget.textContent = '已继续 · 中性正文';
 };
 const group = document.querySelector('.category-group');
 const list = document.querySelector('#shop-list-pages');
 const search = document.querySelector('input[type=search]');
 const rows = [];
 let activeCategory = '全部';
 function filter() {
  const term = search.value.trim();
  for (const row of rows) {
   row.hidden = !row.querySelector('.clothing-name').textContent.includes(term) || (activeCategory !== '全部' && row.dataset.category !== activeCategory);
  }
  document.querySelector('#filter-status').textContent = '显示 ' + rows.filter(row => !row.hidden).length + ' 项';
 }
 for (const name of ['全部', '常用', '其他']) {
  const button = document.createElement('button');
  button.className = 'category-tab' + (name === '全部' ? ' active' : '');
  button.textContent = name;
  button.onclick = () => {
   group.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === button));
   activeCategory = name;
   filter();
  };
  group.append(button);
 }
 for (let i = 1; i <= 12; i++) {
  const row = document.createElement('div');
  row.className = 'clothing-item'; row.id = 'item-' + i;
  row.dataset.category = i <= 6 ? '常用' : '其他';
  row.innerHTML = '<span class="clothing-body"><span class="clothing-name"><a href="#" class="link-internal" data-passage="Neutral"></a></span></span><span class="clothing-price">£120</span>';
  const link = row.querySelector('a');
  link.textContent = i + ' · 中性样品';
  link.onclick = event => {
   event.preventDefault(); vars.clothes_choice = i - 1;
   const details = document.querySelector('.clothing-details');
   details.innerHTML = '<h3>中性样品 ' + i + '</h3><p>这是中性的商品说明。</p><div class="clothing-colours-div"><label>备注<input></label></div><div class="buy-buttons"><button class="link-internal" id="buy">购买</button></div><div class="try-buttons"><button class="link-internal" id="try">试穿</button></div><p id="result" role="status"></p>';
   for (const button of details.querySelectorAll('button')) {
    button.onclick = () => { details.querySelector('#result').textContent = button.textContent + '：中性操作已触发'; };
   }
  };
  rows.push(row); list.append(row);
 }
 search.addEventListener('input', filter);
 document.querySelector('#reset-filter').onclick = () => {
  search.value = ''; group.querySelector('button').click();
 };
 filter();
})();
