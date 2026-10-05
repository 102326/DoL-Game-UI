interface ShopPageExperiment {enabled?:boolean;version?:string;setEnabled?:(value:unknown)=>boolean;reset?:()=>boolean}
(function initDoLShopPageExperiment(global:Window & {DoLShopPageExperiment?:ShopPageExperiment}) {
  'use strict';

  const api = global.DoLShopPageExperiment || {};
  if (typeof api.enabled !== 'boolean') api.enabled = false;
  api.version = '2.2.0';
  api.setEnabled = function setEnabled(value:unknown) {
    api.enabled = value === true;
    return api.enabled;
  };
  api.reset = function reset() {
    api.enabled = false;
    return api.enabled;
  };
  global.DoLShopPageExperiment = api;
})(window);
