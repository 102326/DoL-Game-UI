/** Viewport rectangles include CSS zoom; scrollTop and margins use container CSS pixels. */
export function navigationRect(container:HTMLElement,box:DOMRect){
 const view=container.getBoundingClientRect(),sx=view.width/container.offsetWidth,sy=view.height/container.offsetHeight;
 if(![sx,sy,view.left,view.top,box.left,box.top,box.width,box.height,container.scrollLeft,container.scrollTop].every(Number.isFinite)||sx<=0||sy<=0||box.width<=0||box.height<=0)return;
 return{left:(box.left-view.left)/sx+container.scrollLeft-container.clientLeft,top:(box.top-view.top)/sy+container.scrollTop-container.clientTop,width:box.width/sx,height:box.height/sy};
}

export function navigationScrollTop(container:HTMLElement,target:HTMLElement,margin:number){
 const view=container.getBoundingClientRect(),box=target.getBoundingClientRect(),scale=view.height/container.offsetHeight;
 if(![scale,box.top,view.top,container.scrollTop,margin].every(Number.isFinite)||scale<=0)return;
 const top=container.scrollTop+(box.top-view.top)/scale-margin;
 return Number.isFinite(top)?top:undefined;
}
