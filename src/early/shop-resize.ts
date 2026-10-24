// This body is compiled into the two original SugarCube resize callbacks.
interface PaginationQuery {
 find(selector:string):PaginationQuery;
 width():number|undefined;
 outerWidth():number|undefined;
 children():{length:number};
 toggleClass(name:string,enabled:boolean):unknown;
}
declare const $:(target:string|PaginationQuery)=>PaginationQuery;
const pagination=$('#shop-pagination');
const pages=$(pagination).find('.shop-pages');
const buttons=$(pagination).find('.btn-pagination');
const width=pagination.width(),buttonWidth=buttons.outerWidth();
const isEnoughSpace=((width??NaN)-(buttonWidth??NaN)*2-32)/pages.children().length>=22;
pages.toggleClass('hidden',!isEnoughSpace);
pagination.find('.shop-pages-number').toggleClass('hidden',isEnoughSpace);
export {};
