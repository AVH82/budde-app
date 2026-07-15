(function(root){
  const TRUST_MIN_ANGLE=-48;
  const TRUST_MAX_ANGLE=48;
  const RECEIPT_FIELD_FALLBACK='À vérifier';
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
  function upper(value){return String(value||'').trim().toLocaleUpperCase('fr-FR')}
  function amountNumber(value){
    if(typeof value==='number')return Number.isFinite(value)?value:0;
    const normalized=String(value||'').replace(/[^0-9,.-]/g,'').replace(',', '.');
    const parsed=Number(normalized);
    return Number.isFinite(parsed)?parsed:0;
  }
  function validDate(value){
    if(!value||value===RECEIPT_FIELD_FALLBACK)return false;
    const parsed=Date.parse(value);
    return Number.isFinite(parsed);
  }
  function receiptTrustSignals(state={}){
    const fields=state.fields||{};
    const rawFields=state.rawFields||{};
    const diagnostic=state.ocrDiagnostic||rawFields.diagnostic||{};
    const origins=state.ocrFieldOrigins||{};
    const merchant=upper(fields.merchant||rawFields.merchant);
    const amount=amountNumber(fields.amount||rawFields.total||rawFields.amount);
    const rawDate=fields.date||rawFields.date;
    const hasReliableMerchant=!!merchant&&merchant!=='INCONNU'&&merchant!==upper(RECEIPT_FIELD_FALLBACK);
    const hasValidAmount=amount>0;
    const hasReliableDate=validDate(rawDate)&&origins.date!==false&&diagnostic.date?.reliable!==false&&diagnostic.date?.status!=='warning';
    const reliableMainFields=[hasReliableMerchant,hasValidAmount,hasReliableDate].filter(Boolean).length;
    const noOcrResult=!state.lastOcrFields&&!rawFields.merchant&&!rawFields.total&&!rawFields.amount&&!rawFields.date;
    const notReceipt=state.isLikelyReceipt===false||state.validationStatus==='invalid'||state.error||state.visionReport?.isReceipt===false||state.visionReport?.receipt?.isReceipt===false||diagnostic.isReceipt===false||diagnostic.likelyReceipt===false;
    const requiresFullReview=state.requiresFullReview===true||state.validationStatus==='warning'||(!hasReliableMerchant&&!hasValidAmount)||(state.step==='done'&&reliableMainFields===0);
    const isLikelyReceipt=!notReceipt&&!noOcrResult&&(hasReliableMerchant||hasValidAmount||hasReliableDate||normalizeTrustScore(state.trust)>=45);
    return {hasReliableMerchant,hasValidAmount,hasReliableDate,reliableMainFields,noOcrResult,notReceipt,isLikelyReceipt,requiresFullReview,amount};
  }
  function computeEffectiveReceiptTrust(state={}){
    const baseTrust=normalizeTrustScore(state?.trust);
    if(!baseTrust)return 0;
    const signals=receiptTrustSignals(state);
    if(signals.noOcrResult&&signals.reliableMainFields===0)return 0;
    if(signals.notReceipt)return Math.min(baseTrust,15);
    if(!signals.hasReliableMerchant&&!signals.hasValidAmount)return Math.min(baseTrust,15);
    if(signals.requiresFullReview&&signals.reliableMainFields<=1)return Math.min(baseTrust,15);
    if(signals.reliableMainFields===0)return 0;
    if(signals.reliableMainFields===1)return Math.min(baseTrust,30);
    if(signals.reliableMainFields===2)return Math.min(baseTrust,40);
    return baseTrust;
  }
  const api={TRUST_MIN_ANGLE,TRUST_MAX_ANGLE,normalizeTrustScore,trustScoreToAngle,receiptTrustSignals,computeEffectiveReceiptTrust};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.TrustmeterService=api;
})(typeof window!=='undefined'?window:globalThis);
