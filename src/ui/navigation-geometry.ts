/** Viewport rectangles include CSS zoom; scrollTop and margins use container CSS pixels. */
export function navigationScrollTop(container:HTMLElement,target:HTMLElement,margin:number){
 const view=container.getBoundingClientRect(),box=target.getBoundingClientRect(),scale=view.height/container.offsetHeight;
 if(![scale,box.top,view.top,container.scrollTop,margin].every(Number.isFinite)||scale<=0)return;
 const top=container.scrollTop+(box.top-view.top)/scale-margin;
 return Number.isFinite(top)?top:undefined;
}
