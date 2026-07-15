(function(root){
  const TRUST_MIN_ANGLE=-48;
  const TRUST_MAX_ANGLE=48;
  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
  function normalizeTrustScore(value){
    const score=Number(value);
    if(!Number.isFinite(score))return 0;
    const percent=score>0&&score<=1?score*100:score;
    return clamp(percent,0,100);
  }
  function trustScoreToAngle(value){
    const score=normalizeTrustScore(value);
    return TRUST_MIN_ANGLE+(score/100)*(TRUST_MAX_ANGLE-TRUST_MIN_ANGLE);
  }
  const api={TRUST_MIN_ANGLE,TRUST_MAX_ANGLE,normalizeTrustScore,trustScoreToAngle};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.TrustmeterService=api;
})(typeof window!=='undefined'?window:globalThis);
