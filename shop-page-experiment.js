(function initDoLShopPageExperiment(global) {
  'use strict';

  const api = global.DoLShopPageExperiment || {};
  if (typeof api.enabled !== 'boolean') api.enabled = false;
  api.version = '1.1.0';
  api.setEnabled = function setEnabled(value) {
    api.enabled = value === true;
    return api.enabled;
  };
  api.reset = function reset() {
    api.enabled = false;
    return api.enabled;
  };
  global.DoLShopPageExperiment = api;
})(window);
