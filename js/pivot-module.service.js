(function(global){
  'use strict';

  const PIVOT_ASSET_ROOT='assets/pivot/';
  const PIVOT_STATES=Object.freeze({
    idle:'idle',
    settings:'settings',
    trustmeter:'trustmeter'
  });
  const PIVOT_CONSTRAINTS=Object.freeze({
    minDurationMs:450,
    maxDurationMs:750,
    respectsReducedMotion:true,
    visualIntegrationEnabled:false
  });

  function createPivotModulePlan(initialState=PIVOT_STATES.idle){
    const state=Object.values(PIVOT_STATES).includes(initialState)?initialState:PIVOT_STATES.idle;
    return Object.freeze({
      assetRoot:PIVOT_ASSET_ROOT,
      state,
      states:PIVOT_STATES,
      constraints:PIVOT_CONSTRAINTS
    });
  }

  global.BuddePivotModule=Object.freeze({
    createPivotModulePlan,
    PIVOT_ASSET_ROOT,
    PIVOT_STATES,
    PIVOT_CONSTRAINTS
  });
})(window);
