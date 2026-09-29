export function startLayout(root=window){
  if(root.DMTLayout)return;
  let active=false, shade, bar, observer, previousFocus, disposed=false;
  const narrow=root.matchMedia('(max-width: 899px)');
  const visible=node=>!!node && node.getClientRects().length>0 && getComputedStyle(node).visibility!=='hidden';
  function stow(){
    if(!bar || bar.classList.contains('stowed'))return;
    if(typeof root.UIBar?.stow==='function')root.UIBar.stow();
    else document.getElementById('ui-bar-toggle')?.click();
    updateShade();
    document.getElementById('ui-bar-toggle')?.focus({preventScroll:true});
  }
  function updateShade(){
    if(!shade)return;
    const open=active&&narrow.matches&&visible(bar)&&!bar.classList.contains('stowed');
    shade.hidden=!open;
    // Keep game buttons intact; native sidebar visibility still controls the rail.
    if(open&&!previousFocus)previousFocus=document.activeElement;
    if(!open)previousFocus=null;
  }
  function sync(preferences){
    if(disposed)return;
    active=!!(preferences.enabled&&preferences.layout);
    const html=document.documentElement;
    html.toggleAttribute('data-dmt-layout',active);
    html.toggleAttribute('data-dmt-compact-stats',active&&preferences.compactStats);
    html.removeAttribute('data-dmt-stats-collapsed');
    if(active)html.dataset.dmtReading=preferences.wideReading?'wide':'standard';else delete html.dataset.dmtReading;
    if(!document.body)return;
    document.getElementById('dmt-status-toggle')?.remove();
    if(!shade){
      shade=document.createElement('button');shade.id='dmt-drawer-shade';shade.type='button';shade.hidden=true;
      shade.setAttribute('aria-label','收起侧栏');shade.tabIndex=-1;
      shade.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();stow();});
      document.body.append(shade);
    }
    const next=document.getElementById('ui-bar');
    if(next!==bar){observer?.disconnect();bar=next;if(bar){observer=new MutationObserver(updateShade);observer.observe(bar,{attributes:true,attributeFilter:['class']});}}
    updateShade();
  }
  function onBack(event){
    if(active&&event.type==='keydown'&&event.key==='Tab'&&shade&&!shade.hidden&&!document.querySelector('dialog[open]')&&!visible(document.getElementById('customOverlay'))&&!visible(document.getElementById('ui-dialog'))){
      const targets=[...bar.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(node=>visible(node)&&!node.disabled&&node.tabIndex>=0);
      const first=targets[0],last=targets[targets.length-1];
      if(first&&(!bar.contains(document.activeElement)||(event.shiftKey&&document.activeElement===first)||(!event.shiftKey&&document.activeElement===last))){event.preventDefault();(event.shiftKey?last:first).focus();}
      return;
    }
    if(!active || (event.type==='keydown'&&event.key!=='Escape'))return;
    if(document.querySelector('dialog[open]'))return;
    // SugarCube confirmations sit above the custom overlay that opened them.
    const dialog=root.SugarCube?.Dialog??root.Dialog;
    if(visible(document.getElementById('ui-dialog')) && typeof dialog?.close==='function'){
      event.preventDefault();event.stopImmediatePropagation();dialog.close();return;
    }
    const custom=document.getElementById('customOverlay');
    const close=custom?.querySelector('.customOverlayClose');
    if(visible(custom)&&(typeof root.closeOverlay==='function'||visible(close))){
      event.preventDefault();event.stopImmediatePropagation();if(typeof root.closeOverlay==='function')root.closeOverlay();else close.click();return;
    }
    if(shade&&!shade.hidden){event.preventDefault();event.stopImmediatePropagation();stow();}
  }
  document.addEventListener('keydown',onBack,true);
  root.addEventListener('backbutton',onBack,true);
  narrow.addEventListener('change',updateShade);
  root.DMTLayout={sync,destroy(){
    disposed=true;observer?.disconnect();shade?.remove();document.getElementById('dmt-status-toggle')?.remove();document.removeEventListener('keydown',onBack,true);
    root.removeEventListener('backbutton',onBack,true);narrow.removeEventListener('change',updateShade);
    for(const name of ['data-dmt-layout','data-dmt-compact-stats','data-dmt-stats-collapsed','data-dmt-reading'])document.documentElement.removeAttribute(name);
    delete root.DMTLayout;
  }};
}
