// One shared wall-clock schedule. Never wait for one variant to finish first.
export const sequence=[
 [800,'打开设置'],[3000,'切换：材质'],[4700,'切换：入口'],[6400,'切换：阅读'],
 [8300,'切换：材质'],[8460,'切换：入口'],[8620,'切换：阅读'],[10300,'关闭设置'],
 [12400,'打开设置'],[12700,'展开中关闭'],[12860,'关闭中重新打开'],[15100,'关闭设置'],
] as const;
export const sequenceEnd=17400;
