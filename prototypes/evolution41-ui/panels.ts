import {startCharacteristics} from '../../src/characteristics/main';
import {startSocial} from '../../src/social/main';
import {startPanels} from '../../src/panels/main';
import {hubPreview} from '../evolution-integration/hub-preview';
import './panels.css';

// Synthetic rendered native-shaped content, driven by the real UI controllers.
// No game macros, saves, business variables or third-party content are loaded.
export const panelCases={characteristics:'属性',social:'社交',journal:'日志',traits:'特质',statistics:'统计',feats:'成就',cheats:'作弊',settings:'原版设置',attitudes:'态度（正文）'} as const;
export type PreviewPanel=keyof typeof panelCases;
const overlayKeys:Partial<Record<PreviewPanel,string>>={feats:'gameFeats',settings:'options'};
const action='<button type="button" data-demo-action>演示原控件</button>';
const settings=(title:string)=>`<h2 class="settingsHeader">${title}</h2><div class="settingsGrid"><div class="settingsToggleItem"><label><input type="checkbox">启用示例选项</label></div><div class="settingsToggleItem"><label>展示方式 <select aria-label="示例展示方式"><option>标准</option><option>详细</option></select></label></div></div><p>这里使用合成内容观察排版与输入，操作只改变本页示例。</p>${action}`;
function content(kind:PreviewPanel):string{
 switch(kind){
  case 'characteristics':return '<div id="characteristics-display">'+[['base-characteristics','基础属性'],['base-skills','生活技能'],['school-grades','学业']].map(([id,label])=>`<h2>${label}</h2><div id="${id}"><div class="characteristic-box"><h3>观察项目</h3><p>清晰的标题与数值</p><strong>72 / 100</strong></div><div class="characteristic-box"><h3>第二项目</h3><p>较长的描述用于观察窄屏换行与卡片边界。</p>${action}</div></div>`).join('')+'</div>';
  case 'social':return '<div id="relation-display">'+[['npc-relations','主要关系'],['secondary-npcs','其他人物'],['global-recognition','知名度']].map(([id,label])=>`<h2>${label}</h2><div id="${id}" class="relation-box-list"><div class="relation-box"><h3>示例对象</h3><p>这是一段较长的说明，用于核对信息密度、正文与控件的关系。</p>${action}</div></div>`).join('')+'</div>';
  case 'journal':return `<h1 class="header">当前记录</h1><details class="journal" open><summary>今日事项</summary><p>一段较长的记录。保留原节点上的折叠、文字输入和滚动，观察材质是否干扰阅读。</p>${action}</details><h1 class="header">笔记</h1><div id="journalNotesTextarea"><label>本页临时笔记<textarea aria-label="本页临时笔记" placeholder="仅保留在当前演示节点中"></textarea></label></div>`;
  case 'traits':return '<div id="traitListsSearch"><div class="foldout"><h2 class="foldoutHeader">筛选</h2><label>类别 <select aria-label="示例类别"><option>全部</option><option>已显示</option></select></label></div></div><div id="traitLists"><section><h4 class="traitHeading">已显示特质</h4><div class="trait"><span>专注</span> - <small>合成描述，观察名称与说明的层级。</small></div><div class="trait"><span>从容</span> - <small>第二条说明保持原有节点。</small></div></section><section><h4 class="traitHeading">其它项目</h4><div class="trait"><span>探索</span> - <small>较长描述用于观察换行与间距。</small></div></section></div>'+action;
  case 'statistics':return '<details class="foldout" open><summary class="foldoutHeader">概览</summary><p>累计项目 <strong>128</strong> · 完成项目 <strong>96</strong></p>'+action+'</details><details class="foldout" open><summary class="foldoutHeader">详细记录</summary><p>长内容与折叠控件继续由原节点处理。</p></details>';
  case 'feats':return '<div id="featTypes"><label>筛选 <select aria-label="示例筛选"><option>全部</option><option>已完成</option></select></label></div><div id="featsList">'+Array.from({length:12},(_,i)=>`<article class="feat"><div class="featText"><strong>记录 ${i+1}</strong><p>合成条目，核对长列表、边界与原控件。</p>${i===0?action:''}</div></article>`).join('')+'</div>';
  case 'cheats':return '<div id="cheatsShown">'+settings('状态')+settings('其它')+'</div>';
  case 'settings':return settings('通用')+settings('显示');
  case 'attitudes':return settings('常用态度')+settings('其它态度');
 }
}
export function createPanelPreview(){
 const owner=hubPreview.host.register('UI41PanelPreview'),framework={host:hubPreview.host,owner};
 const overlay=document.createElement('section');overlay.id='customOverlay';overlay.dataset.ui41Preview='';overlay.className='hidden';
 overlay.innerHTML='<div id="customOverlayTitle"><div id="overlayTabs"></div><button type="button" data-demo-restore>恢复新版</button><button type="button" data-demo-close>关闭窗口</button></div><div id="customOverlayContent"></div>';
 document.body.append(overlay);
 const nativeBody=overlay.querySelector<HTMLElement>('#customOverlayContent')!,tabs=overlay.querySelector<HTMLElement>('#overlayTabs')!;
 const characteristics=startCharacteristics(window,framework),social=startSocial(window,framework),panels=startPanels(window,framework);
 const originalPassage=document.querySelector<HTMLElement>('#passages .passage')!,passages=originalPassage.parentElement!,notice=document.querySelector<HTMLElement>('#notice')!;
 let inline:HTMLElement|undefined,current:PreviewPanel|undefined,calls=0,disposed=false,originalHidden=originalPassage.hidden;
 const refresh=()=>{characteristics.refresh();social.refresh();panels.refresh();hubPreview.navigation.refresh()};
 function close(){if(disposed)return;overlay.classList.add('hidden');inline?.remove();inline=undefined;originalPassage.hidden=originalHidden;current=undefined;refresh()}
 function open(kind:PreviewPanel){
  if(disposed)return;close();current=kind;
  if(kind==='attitudes'){
   originalHidden=originalPassage.hidden;originalPassage.hidden=true;inline=document.createElement('section');inline.className='passage';inline.dataset.passage='Attitudes';inline.dataset.ui41Preview='';
   inline.innerHTML='<button type="button" data-demo-restore>恢复新版</button><button type="button" data-demo-close>返回正文</button>'+content(kind);passages.append(inline);inline.querySelector('[data-demo-close]')!.addEventListener('click',close);inline.querySelector('[data-demo-restore]')!.addEventListener('click',restore);
  }else{
   overlay.dataset.overlay=overlayKeys[kind]??kind;
   tabs.replaceChildren(...Object.entries(panelCases).filter(([key])=>key!=='attitudes').map(([key,label])=>{const button=document.createElement('button');button.type='button';button.className='link-internal macro-button'+(key===kind?' tab-selected':'');button.textContent=label==='原版设置'?'选项':label;button.onclick=()=>open(key as PreviewPanel);return button}));
   nativeBody.innerHTML=content(kind);nativeBody.scrollTop=0;overlay.classList.remove('hidden');
  }
  const root=inline??nativeBody;for(const button of root.querySelectorAll<HTMLButtonElement>('[data-demo-action]'))button.onclick=()=>{notice.textContent=`窗口演示操作：${++calls} 次 · ${panelCases[kind]}`};
  refresh();if(inline)inline.scrollIntoView({block:'start'});
 }
 function restore(){if(current){const kind=current;if(kind==='characteristics')characteristics.setEnabled(true);else if(kind==='social')social.setEnabled(true);else panels.setEnabled(kind,true);refresh()}}
 overlay.querySelector('[data-demo-close]')!.addEventListener('click',close);overlay.querySelector('[data-demo-restore]')!.addEventListener('click',restore);
 return{open,close,current:()=>current,counts:()=>calls,restore,dispose(){if(disposed)return;close();disposed=true;characteristics.destroy();social.destroy();panels.destroy();owner.dispose();overlay.remove()}};
}
