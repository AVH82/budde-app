(function(root){
  const TRUST_MIN_ANGLE=-90;
  const TRUST_MAX_ANGLE=90;
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
  function isReviewFallback(value){
    return upper(value)===upper(RECEIPT_FIELD_FALLBACK);
  }
  function isBlank(value){
    return value===null||value===undefined||String(value).trim()==='';
  }
  function isInvalidReceiptAmount(value){
    if(isBlank(value)||isReviewFallback(value))return true;
    if(typeof value==='number')return !Number.isFinite(value)||value<=0;
    const text=String(value).trim();
    if(!text||isReviewFallback(text))return true;
    const numeric=text.replace(/[^0-9,.-]/g,'').replace(',', '.');
    if(!numeric)return true;
    const parsed=Number(numeric);
    return !Number.isFinite(parsed)||parsed<=0;
  }
  function hasExplicitReviewValue(value){
    if(value===null||value===undefined)return false;
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return isReviewFallback(value);
    if(Array.isArray(value))return value.some(hasExplicitReviewValue);
    if(typeof value==='object')return Object.values(value).some(hasExplicitReviewValue);
    return false;
  }
  function hasWarningStatus(value){
    if(!value||typeof value!=='object')return false;
    if(value.status==='warning'||value.status==='invalid'||value.validationStatus==='warning'||value.validationStatus==='invalid'||value.requiresVerification===true||value.requiresReview===true||value.needsVerification===true)return true;
    return Object.values(value).some(item=>item&&typeof item==='object'&&hasWarningStatus(item));
  }
  function hasUnreliableOcrOrigin(state={},diagnostic={}){
    const origins=state.ocrFieldOrigins||{};
    const locked=state.lockedFields||{};
    const requiredOriginKeys=['merchant','amount','date'];
    const hasUnreliableMainOrigin=requiredOriginKeys.some(key=>origins[key]===false&&!locked[key]);
    return hasUnreliableMainOrigin||diagnostic.ocrReliable===false||diagnostic.reliable===false||diagnostic.originReliable===false;
  }
  function validDate(value){
    if(!value||value===RECEIPT_FIELD_FALLBACK)return false;
    const parsed=Date.parse(value);
    return Number.isFinite(parsed);
  }
  function hasBlockingReceiptWarning(state={}){
    const fields=state.fields||{};
    const rawFields=state.rawFields||{};
    const diagnostic=state.ocrDiagnostic||rawFields.diagnostic||{};
    const merchant=fields.merchant??rawFields.merchant;
    const merchantDiagnostic=diagnostic.merchant||diagnostic.vendor||diagnostic.commerchant;
    const unreliableMerchant=state.merchantReliable===false||merchantDiagnostic?.reliable===false||merchantDiagnostic?.trusted===false||merchantDiagnostic?.status==='warning'||merchantDiagnostic?.status==='invalid';
    const amount=fields.amount??rawFields.total??rawFields.amount;
    const date=fields.date??rawFields.date;
    const category=fields.category??rawFields.category;
    const notReceipt=state.isLikelyReceipt===false||state.validationStatus==='invalid'||state.visionReport?.isReceipt===false||state.visionReport?.receipt?.isReceipt===false||diagnostic.isReceipt===false||diagnostic.likelyReceipt===false;
    return isBlank(merchant)||upper(merchant)==='INCONNU'||isReviewFallback(merchant)||unreliableMerchant
      ||isInvalidReceiptAmount(amount)
      ||isBlank(date)||isReviewFallback(date)||state.dateReliable===false||diagnostic.date?.reliable===false||diagnostic.date?.status==='warning'
      ||isReviewFallback(category)||hasExplicitReviewValue(fields)||hasExplicitReviewValue(rawFields)
      ||state.requiresFullReview===true||state.validationStatus==='warning'||state.validationStatus==='invalid'
      ||hasUnreliableOcrOrigin(state,diagnostic)||hasWarningStatus(diagnostic)||notReceipt;
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
    const hasReliableDate=validDate(rawDate)&&(origins.date!==false||state.lockedFields?.date===true)&&diagnostic.date?.reliable!==false&&diagnostic.date?.status!=='warning';
    const reliableMainFields=[hasReliableMerchant,hasValidAmount,hasReliableDate].filter(Boolean).length;
    const noOcrResult=!state.lastOcrFields&&!rawFields.merchant&&!rawFields.total&&!rawFields.amount&&!rawFields.date;
    const notReceipt=state.isLikelyReceipt===false||state.validationStatus==='invalid'||state.error||state.visionReport?.isReceipt===false||state.visionReport?.receipt?.isReceipt===false||diagnostic.isReceipt===false||diagnostic.likelyReceipt===false;
    const requiresFullReview=state.requiresFullReview===true||state.validationStatus==='warning'||(!hasReliableMerchant&&!hasValidAmount)||(state.step==='done'&&reliableMainFields===0);
    const isLikelyReceipt=!notReceipt&&!noOcrResult&&(hasReliableMerchant||hasValidAmount||hasReliableDate||normalizeTrustScore(state.trust)>=45);
    return {hasReliableMerchant,hasValidAmount,hasReliableDate,reliableMainFields,noOcrResult,notReceipt,isLikelyReceipt,requiresFullReview,amount};
  }
  function computeEffectiveReceiptTrust(state={}){
    const baseTrust=normalizeTrustScore(state?.trust);
    const signals=receiptTrustSignals(state);
    if(!baseTrust)return 0;
    if(signals.noOcrResult&&signals.reliableMainFields===0)return 0;
    if(signals.notReceipt)return 0;
    if(!signals.hasReliableMerchant&&!signals.hasValidAmount)return 0;
    if(hasBlockingReceiptWarning(state))return 0;
    if(signals.requiresFullReview&&signals.reliableMainFields<=1)return 0;
    if(signals.reliableMainFields===0)return 0;
    if(signals.reliableMainFields===1)return Math.min(baseTrust,30);
    if(signals.reliableMainFields===2)return Math.min(baseTrust,40);
    return baseTrust;
  }
  const api={TRUST_MIN_ANGLE,TRUST_MAX_ANGLE,normalizeTrustScore,trustScoreToAngle,receiptTrustSignals,hasBlockingReceiptWarning,computeEffectiveReceiptTrust};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.TrustmeterService=api;
})(typeof window!=='undefined'?window:globalThis);
