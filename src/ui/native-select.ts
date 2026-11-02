/** Let the browser close its open picker before an owned surface handles Escape. */
export function isOpenSelectEscape(event:KeyboardEvent){
 if(event.key!=='Escape')return false;
 const select=event.target instanceof Element?event.target.closest('select'):null;
 return !!select&&typeof CSS!=='undefined'&&CSS.supports('selector(select:open)')&&select.matches(':open');
}
