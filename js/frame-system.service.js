(function(global){
  'use strict';

  const FRAME_ASSET_ROOT='assets/frame/';
  const FRAME_REGIONS=Object.freeze({
    shell:'terminal-shell',
    header:'terminal-header',
    viewport:'terminal-viewport',
    dock:'terminal-dock'
  });
  const FRAME_ASSET_SLOTS=Object.freeze({
    front:'terminal-frame-front',
    back:'terminal-frame-back',
    left:'terminal-side-left',
    right:'terminal-side-right'
  });

  function createFrameSystemPlan(options={}){
    return Object.freeze({
      assetRoot:options.assetRoot||FRAME_ASSET_ROOT,
      regions:FRAME_REGIONS,
      assetSlots:FRAME_ASSET_SLOTS,
      reducedMotion:options.reducedMotion===true,
      visualIntegrationEnabled:false
    });
  }

  global.BuddeFrameSystem=Object.freeze({
    createFrameSystemPlan,
    FRAME_ASSET_ROOT,
    FRAME_REGIONS,
    FRAME_ASSET_SLOTS
  });
})(window);
