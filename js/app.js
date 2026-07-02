
const MONTHS=['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE'];
const DEFAULT_DB={
  schemaVersion:1,
  app:'Budd€',
  settings:{currency:'EUR',locale:'fr-FR'},
  cards:[{id:'main',name:'Carte principale',startMonth:new Date().toISOString().slice(0,7)}],
  currentCardId:'main',
  currentMonth:new Date().toISOString().slice(0,7),
  updatedAt:new Date().toISOString(),
  budgets:{main:{}},
  budgetRules:[],
  expenses:[],
  merchants:{},
  categories:{},
  ocr:{aliases:{},learning:{}}
};
function clone(o){return JSON.parse(JSON.stringify(o))}
function normalizeDb(input){
  const d={...clone(DEFAULT_DB), ...(input||{})};
  d.cards=Array.isArray(d.cards)&&d.cards.length?d.cards:clone(DEFAULT_DB.cards);
  d.currentCardId=d.currentCardId||d.cards[0].id;
  d.currentMonth=d.currentMonth||new Date().toISOString().slice(0,7);
  d.updatedAt=Number.isNaN(Date.parse(d.updatedAt))?new Date().toISOString():d.updatedAt;
  d.budgets=d.budgets||{};
  d.budgetRules=Array.isArray(d.budgetRules)?d.budgetRules:[];
  d.expenses=Array.isArray(d.expenses)?d.expenses:[];
  d.merchants=d.merchants||{};
  d.categories=d.categories||{};
  d.ocr=d.ocr||{aliases:{},learning:{}};
  return d;
}
let db=StorageService.load(normalizeDb,DEFAULT_DB);let selectedYM=db.currentMonth||new Date().toISOString().slice(0,7);let editId=null;let lastGoogleDriveBackupAt=null;let lastGoogleDriveRestoreAt=null;let lastGoogleDriveBackupMessage='';let lastGoogleDriveRestoreMessage='';let lastAutoSyncDiagnosticMessage='';let googleDriveBackupInProgress=null;let cloudStartupSyncInProgress=false;let lastCloudStartupSyncKey='';let autoSyncSuspended=false;let offlineEntryMode=false;let appEntryOpened=false;let pickerYear=+selectedYM.slice(0,4);function setAutoSyncDiagnostic(message){lastAutoSyncDiagnosticMessage=message;setText('autoSyncDiagnosticStatus',message)}function setEntryStatus(message){setText('entryGateStatus',message)}function openAppFromEntry(options={}){appEntryOpened=true;offlineEntryMode=!!options.offline;const gate=document.getElementById('entryGate');if(gate)gate.hidden=true;renderGoogleAuthStatus()}function showEntryGate(){const gate=document.getElementById('entryGate');if(!gate||appEntryOpened)return;gate.hidden=false;setEntryStatus('')}function updateEntryGate(){if(appEntryOpened)return;if(window.GoogleAuthService&&GoogleAuthService.isSignedIn()){openAppFromEntry({offline:false});checkGoogleDriveStartupSync();return}showEntryGate()}function touchDb(){db.updatedAt=new Date().toISOString()}function save(markUpdated=false){db.currentMonth=selectedYM;if(markUpdated){touchDb();setAutoSyncDiagnostic('')}StorageService.save(db);if(markUpdated&&!autoSyncSuspended)AutoSyncService.schedule()}const AutoSyncService={delayMs:5000,timer:null,schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.run(),this.delayMs);setAutoSyncDiagnostic('')},async run(){this.timer=null;const signedIn=!!(window.GoogleAuthService&&GoogleAuthService.isSignedIn());if(!window.GoogleAuthService||!window.GoogleDriveAdapter||!signedIn)return;try{await backupToGoogleDrive({silent:true});setAutoSyncDiagnostic('')}catch(error){console.warn('Synchronisation automatique impossible.',error);setAutoSyncDiagnostic('Dernière synchronisation impossible')}},cancel(){clearTimeout(this.timer);this.timer=null}};function ym(y,m){return `${y}-${String(m).padStart(2,'0')}`}function shift(n){let y=+selectedYM.slice(0,4),m=+selectedYM.slice(5,7)+n;while(m<1){m+=12;y--}while(m>12){m-=12;y++}setYM(ym(y,m))}function setYM(v){selectedYM=v;pickerYear=+v.slice(0,4);save();render()}function euro(n){return (Number(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'}function upper(s){return String(s||'INCONNU').trim().toUpperCase()}function expEUR(e){return Number(e.amountEUR??(Number(e.amount||0)*Number(e.fxRate||1)))||0}function currentCard(){return db.currentCardId||db.cards?.[0]?.id}function monthsBetween(start,end){let a=[];let y=+start.slice(0,4),m=+start.slice(5,7);let ey=+end.slice(0,4),em=+end.slice(5,7);while(y<ey||y===ey&&m<=em){a.push(ym(y,m));m++;if(m>12){m=1;y++}}return a}function budgetFor(cardId,month){let b=db.budgets?.[cardId]||{};if(b[month]!=null)return +b[month];let rules=(db.budgetRules||[]).filter(r=>r.cardId===cardId&&r.startMonth<=month).sort((a,b)=>a.startMonth.localeCompare(b.startMonth));if(rules.length)return +rules.at(-1).amount;let prior=Object.keys(b).filter(k=>k<=month).sort();return prior.length?+b[prior.at(-1)]:0}function monthSpent(cardId,month){return (db.expenses||[]).filter(e=>(!cardId||e.cardId===cardId)&&String(e.dateISO||'').slice(0,7)===month).reduce((s,e)=>s+expEUR(e),0)}function monthlyRemaining(cardId,month){return budgetFor(cardId,month)-monthSpent(cardId,month)}function merchantLogo(name){return 'assets/nav/merchants.png'}function row(e){return `<div class="expense"><div class="logoRound"><img src="${merchantLogo(e.merchant)}"></div><div><div class="merchant">${upper(e.merchant)}</div><div class="meta">${(e.dateISO||'').slice(8,10)}/${(e.dateISO||'').slice(5,7)}/${(e.dateISO||'').slice(0,4)} • ${upper(e.category||'NON CLASSÉ')}</div></div><div><div class="amount">${euro(expEUR(e))}</div><div class="rowBtns"><button class="icon editIcon" aria-label="Modifier" onclick="editExpense('${e.id}')"></button><button class="icon deleteIcon" aria-label="Supprimer" onclick="delExpense('${e.id}')"></button></div></div></div>`}function render(){let cardId=currentCard();let m=+selectedYM.slice(5,7);monthLabel.textContent=MONTHS[m-1]+' '+selectedYM.slice(0,4);let budget=budgetFor(cardId,selectedYM),spent=monthSpent(cardId,selectedYM),remaining=monthlyRemaining(cardId,selectedYM);budgetAmount.textContent=euro(budget);remainingAmount.textContent=euro(remaining);budgetProgress.style.width=Math.min(100, budget?spent/budget*100:0)+'%';spentAmount.textContent='Dépenses : '+euro(spent);let list=(db.expenses||[]).filter(e=>e.cardId===cardId&&String(e.dateISO||'').slice(0,7)===selectedYM).sort((a,b)=>String(b.dateISO).localeCompare(String(a.dateISO)));recentList.innerHTML=list.slice(0,3).map(row).join('')||'<p>Aucune dépense ce mois.</p>';expensesList.innerHTML=list.map(row).join('')||'<p>Aucune dépense ce mois.</p>';renderBudget();renderStats(list,budget,spent,remaining);renderMerchants();renderMonthModal()}function setView(v){document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));document.getElementById(v)?.classList.add('active');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));if(v==='settings')renderGoogleAuthStatus()}function renderBudget(){budgetCard.innerHTML=(db.cards||[]).map(c=>`<option value="${c.id}" ${c.id===currentCard()?'selected':''}>${c.name}</option>`).join('');budgetMonthPick.textContent=MONTHS[+selectedYM.slice(5,7)-1]+' '+selectedYM.slice(0,4)}function renderStats(list,budget,spent,remaining){statsBox.innerHTML=`<div class="stat">Budget du mois<br><b>${euro(budget)}</b></div><div class="stat">Dépenses du mois<br><b>${euro(spent)}</b></div><div class="stat">Budget restant<br><b>${euro(remaining)}</b></div>`;renderGoogleAuthStatus()}
function updateGoogleDriveBackupButtonState(isSignedIn,isConfigured=false){const backupButton=document.getElementById('googleDriveBackupButton'),restoreButton=document.getElementById('googleDriveRestoreButton');if(backupButton)backupButton.disabled=!isSignedIn||!!googleDriveBackupInProgress;if(restoreButton)restoreButton.disabled=!isConfigured}function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}function setGoogleState(label,isConnected=false){const el=document.getElementById('googleState');if(!el)return;el.innerHTML=`<span class="googlePlugIcon ${isConnected?'connected':'disconnected'}" aria-hidden="true"></span><span>${label}</span>`}function renderGoogleAuthStatus(){const statusEl=document.getElementById('googleAuthStatus'),button=document.getElementById('googleAuthButton'),backupStatus=document.getElementById('googleDriveBackupStatus'),restoreStatus=document.getElementById('googleDriveRestoreStatus');setText('localUpdatedAt',db.updatedAt?formatDateTime(db.updatedAt):'Jamais');if(!statusEl||!button)return;if(!window.GoogleAuthService){setGoogleState('Authentification indisponible',false);setText('googleAccount','—');setText('googleDriveMode','Google Drive : indisponible');setText('googleLastBackup',lastGoogleDriveBackupAt?formatDateTime(lastGoogleDriveBackupAt):'Aucune sauvegarde');setText('googleDriveBackupStatus',lastGoogleDriveBackupMessage);setText('autoSyncDiagnosticStatus',offlineEntryMode?'Mode hors ligne — synchronisation désactivée.':lastAutoSyncDiagnosticMessage);button.disabled=true;button.title='Authentification Google indisponible';updateGoogleDriveBackupButtonState(false,false);return}const status=GoogleAuthService.getStatus(),user=GoogleAuthService.getUser(),signedIn=GoogleAuthService.isSignedIn();if(status.configured&&signedIn){setGoogleState('Connecté',true);setText('googleAccount',[user?.email,user?.name].filter(Boolean).join(' — ')||'Compte Google actif');setText('googleDriveMode','Google Drive : sauvegarde manuelle')}else if(status.configured){setGoogleState('Prêt à se connecter',false);setText('googleAccount','—');setText('googleDriveMode','Google Drive : non connecté')}else{setGoogleState('Non configuré',false);setText('googleAccount','—');setText('googleDriveMode','Google Drive : non connecté')}setText('googleLastBackup',lastGoogleDriveBackupAt?formatDateTime(lastGoogleDriveBackupAt):'Aucune sauvegarde');setText('googleDriveBackupStatus',lastGoogleDriveBackupMessage);setText('autoSyncDiagnosticStatus',offlineEntryMode&&!signedIn?'Mode hors ligne — synchronisation désactivée.':lastAutoSyncDiagnosticMessage);if(restoreStatus)restoreStatus.textContent=lastGoogleDriveRestoreMessage||restoreStatus.textContent;button.disabled=!status.configured;button.textContent=signedIn?'Déconnexion Google':'Connexion Google';button.title=status.message;updateGoogleDriveBackupButtonState(signedIn,status.configured);if(backupStatus&&!backupStatus.textContent)backupStatus.textContent='';if(restoreStatus&&!restoreStatus.textContent&&lastGoogleDriveRestoreAt)restoreStatus.textContent=`Restauration Google Drive terminée : ${formatDateTime(lastGoogleDriveRestoreAt)}`}function renderMerchants(){let map={};(db.expenses||[]).forEach(e=>{let k=upper(e.merchant);map[k]??={n:0,t:0};map[k].n++;map[k].t+=expEUR(e)});merchantsList.innerHTML=Object.entries(map).sort((a,b)=>b[1].t-a[1].t).map(([k,v])=>`<div class="expense"><div class="logoRound"><img src="assets/nav/merchants.png"></div><div><div class="merchant">${k}</div><div class="meta">${v.n} dépense(s)</div></div><div class="amount">${euro(v.t)}</div></div>`).join('')}function openMonthModal(){pickerYear=+selectedYM.slice(0,4);monthModal.classList.add('open');renderMonthModal()}function renderMonthModal(){pickerYearEl=document.getElementById('pickerYear'); if(!pickerYearEl)return; pickerYearEl.textContent=pickerYear;monthGrid.innerHTML=MONTHS.map((m,i)=>{let v=ym(pickerYear,i+1);return `<button class="${v===selectedYM?'active':''}" onclick="setYM('${v}');monthModal.classList.remove('open')">${m.slice(0,4)}</button>`}).join('')}function openExpense(id){editId=id||null;let e=id?(db.expenses||[]).find(x=>x.id===id):{};expenseTitle.textContent=id?'Modifier la dépense':'Ajouter une dépense';mMerchant.value=e?.merchant||'';mDate.value=(e?.dateISO||selectedYM+'-01').slice(0,10);mAmount.value=e?.amount||'';mCurrency.value=e?.currency||'EUR';mRate.value=e?.fxRate||1;mCategory.value=e?.category||'';mNote.value=e?.note||'';expenseModal.classList.add('open')}window.editExpense=openExpense;window.delExpense=function(id){let e=(db.expenses||[]).find(x=>x.id===id);if(e&&confirm('Supprimer '+upper(e.merchant)+' ?')){db.expenses=db.expenses.filter(x=>x.id!==id);save(true);render()}};function saveExpenseForm(){let e=editId?(db.expenses||[]).find(x=>x.id===editId):{id:Date.now().toString(36)+Math.random().toString(36).slice(2),cardId:currentCard()};e.merchant=upper(mMerchant.value);e.dateISO=mDate.value+'T12:00:00.000Z';e.amount=+mAmount.value||0;e.currency=mCurrency.value;e.fxRate=+mRate.value||1;e.amountEUR=e.amount*e.fxRate;e.category=upper(mCategory.value||'NON CLASSÉ');e.note=mNote.value;if(!editId)db.expenses.push(e);save(true);expenseModal.classList.remove('open');render()}document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));document.querySelector('[data-action=manual]').onclick=()=>openExpense();document.querySelector('[data-action=scan]').onclick=()=>alert('Scan OCR à reconnecter dans la prochaine étape.');prevMonth.onclick=()=>shift(-1);nextMonth.onclick=()=>shift(1);openMonth.onclick=openMonthModal;monthLabel.onclick=openMonthModal;yearPrev.onclick=()=>{pickerYear--;renderMonthModal()};yearNext.onclick=()=>{pickerYear++;renderMonthModal()};closeMonth.onclick=()=>monthModal.classList.remove('open');monthModal.onclick=e=>{if(e.target===monthModal)monthModal.classList.remove('open')};
budgetMonthPick.onclick=openMonthModal;budgetCard.onchange=()=>{db.currentCardId=budgetCard.value;save();render()};
function budgetLabel(){return MONTHS[+selectedYM.slice(5,7)-1]+' '+selectedYM.slice(0,4)}
function formatDateTime(date){return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'medium'}).format(new Date(date))}
async function backupToGoogleDrive(options={}){const silent=!!options.silent,backupButton=document.getElementById('googleDriveBackupButton'),backupStatus=document.getElementById('googleDriveBackupStatus');if(googleDriveBackupInProgress)return googleDriveBackupInProgress;if(!window.GoogleAuthService){console.error('Sauvegarde Google Drive indisponible : GoogleAuthService absent.');lastGoogleDriveBackupMessage='Sauvegarde Google Drive indisponible : authentification Google absente.';if(backupStatus)backupStatus.textContent=lastGoogleDriveBackupMessage;return}if(!window.GoogleDriveAdapter){console.error('Sauvegarde Google Drive indisponible : GoogleDriveAdapter absent.');lastGoogleDriveBackupMessage='Sauvegarde Google Drive indisponible.';if(backupStatus)backupStatus.textContent=lastGoogleDriveBackupMessage;return}if(!GoogleAuthService.isSignedIn()){if(!silent){lastGoogleDriveBackupMessage='Connectez-vous à Google pour sauvegarder sur Drive.';if(backupStatus)backupStatus.textContent=lastGoogleDriveBackupMessage}return}googleDriveBackupInProgress=(async()=>{try{if(backupButton)backupButton.disabled=true;lastGoogleDriveBackupMessage=silent?'':'Sauvegarde Google Drive en cours…';if(backupStatus)backupStatus.textContent=lastGoogleDriveBackupMessage;await GoogleAuthService.ensureAccessToken();const result=await GoogleDriveAdapter.save(db);lastGoogleDriveBackupAt=new Date();lastGoogleDriveBackupMessage='';if(backupStatus)backupStatus.textContent=lastGoogleDriveBackupMessage;if(!silent&&backupButton){backupButton.textContent='✓ Terminé';setTimeout(()=>{backupButton.textContent='Sauvegarder maintenant'},1500)}if(!silent)showToast('Sauvegarde Google Drive terminée');console.info('Sauvegarde Google Drive Budd€ terminée.',result)}catch(error){console.error('Sauvegarde Google Drive impossible.',error);lastGoogleDriveBackupMessage=silent?'Dernière synchronisation impossible':error?.message||'Erreur pendant la sauvegarde Google Drive.';if(backupStatus&&!silent)backupStatus.textContent=lastGoogleDriveBackupMessage;if(silent)setAutoSyncDiagnostic(lastGoogleDriveBackupMessage);if(!silent)showToast('Erreur sauvegarde Drive')}finally{googleDriveBackupInProgress=null;renderGoogleAuthStatus()}})();return googleDriveBackupInProgress}
async function restoreFromGoogleDrive(){const restoreButton=document.getElementById('googleDriveRestoreButton'),restoreStatus=document.getElementById('googleDriveRestoreStatus');if(restoreStatus)restoreStatus.textContent='Restauration Google Drive lancée…';if(!window.GoogleAuthService){console.error('Restauration Google Drive indisponible : GoogleAuthService absent.');if(restoreStatus)restoreStatus.textContent='Restauration Google Drive indisponible : authentification Google absente.';return}if(!window.GoogleDriveAdapter){console.error('Restauration Google Drive indisponible : GoogleDriveAdapter absent.');if(restoreStatus)restoreStatus.textContent='Restauration Google Drive indisponible.';return}try{if(!GoogleAuthService.isSignedIn()){if(restoreStatus)restoreStatus.textContent='Vous devez être connecté à Google pour restaurer depuis Drive.';return}if(!confirm('Remplacer les données locales par la sauvegarde Google Drive ?')){if(restoreStatus)restoreStatus.textContent='Restauration Google Drive annulée.';return}if(restoreButton)restoreButton.disabled=true;if(restoreStatus)restoreStatus.textContent='Restauration Google Drive en cours…';await GoogleAuthService.ensureAccessToken();const restored=await GoogleDriveAdapter.load();db=normalizeDb(restored);selectedYM=db.currentMonth||selectedYM;pickerYear=+selectedYM.slice(0,4);touchDb();StorageService.save(db);lastGoogleDriveRestoreAt=new Date();if(restoreStatus)restoreStatus.textContent=`Restauration Google Drive terminée : ${formatDateTime(lastGoogleDriveRestoreAt)}`;render();if(restoreButton){restoreButton.textContent='✓ Restauration terminée';setTimeout(()=>{restoreButton.textContent='Restaurer depuis Google Drive'},2000)}showToast('Restauration Google Drive terminée');console.info('Restauration Google Drive Budd€ terminée.')}catch(error){const message=formatGoogleDriveRestoreError(error);console.error('Restauration Google Drive impossible.',error);if(restoreStatus)restoreStatus.textContent=message;showToast('Erreur restauration Drive')}finally{renderGoogleAuthStatus()}}

function compareUpdatedAt(localUpdatedAt,driveUpdatedAt){
  const localTime=Date.parse(localUpdatedAt||''),driveTime=Date.parse(driveUpdatedAt||'');
  if(Number.isNaN(driveTime))return 0;
  if(Number.isNaN(localTime))return 1;
  return driveTime>localTime?1:driveTime<localTime?-1:0;
}
function setGoogleDriveRestoreMessage(message){lastGoogleDriveRestoreMessage=message;setText('googleDriveRestoreStatus',message)}
async function checkGoogleDriveStartupSync(){
  if(cloudStartupSyncInProgress)return;
  if(!window.GoogleAuthService||!window.GoogleDriveAdapter||!GoogleAuthService.isSignedIn())return;
  cloudStartupSyncInProgress=true;
  try{
    await GoogleAuthService.ensureAccessToken();
    const driveData=normalizeDb(await GoogleDriveAdapter.load());
    const comparison=compareUpdatedAt(db.updatedAt,driveData.updatedAt);
    const syncKey=`${db.updatedAt||''}|${driveData.updatedAt||''}`;
    if(comparison<=0)return;
    if(syncKey===lastCloudStartupSyncKey)return;
    lastCloudStartupSyncKey=syncKey;
    const localDate=formatDateTime(db.updatedAt),driveDate=formatDateTime(driveData.updatedAt);
    const shouldRestore=confirm(`Une sauvegarde Google Drive plus récente est disponible.\nLocale : ${localDate}\nGoogle Drive : ${driveDate}\nRestaurer cette version ?`);
    if(!shouldRestore){setGoogleDriveRestoreMessage('Données locales conservées.');return;}
    autoSyncSuspended=true;
    AutoSyncService.cancel();
    db=driveData;
    selectedYM=db.currentMonth||selectedYM;
    pickerYear=+selectedYM.slice(0,4);
    StorageService.save(db);
    lastGoogleDriveRestoreAt=new Date();
    setGoogleDriveRestoreMessage(`Synchronisation Google Drive terminée : ${formatDateTime(lastGoogleDriveRestoreAt)}`);
    render();
    showToast('Synchronisation Google Drive terminée');
  }catch(error){
    const message=error?.message||'';
    if(message.includes('Aucune sauvegarde Google Drive trouvée')){
      setGoogleDriveRestoreMessage('Aucune sauvegarde cloud trouvée.');
    }else{
      console.warn('Synchronisation Google Drive au démarrage impossible.',error);
      setAutoSyncDiagnostic('Synchronisation cloud au démarrage impossible');
    }
  }finally{
    autoSyncSuspended=false;
    cloudStartupSyncInProgress=false;
    renderGoogleAuthStatus();
  }
}
function formatGoogleDriveRestoreError(error){const message=error?.message||'';if(message.includes('Aucune sauvegarde Google Drive trouvée'))return 'Aucune sauvegarde Google Drive trouvée.';if(message.includes('JSON'))return 'Sauvegarde Google Drive invalide : JSON illisible.';if(message.includes('Failed to fetch')||message.includes('NetworkError')||message.includes('Network request failed'))return 'Erreur réseau pendant la restauration Google Drive.';if(message)return `Erreur Google Drive : ${message}`;return 'Erreur Google Drive pendant la restauration.'}
function showToast(msg){let t=document.getElementById('buddeToast');if(!t){t=document.createElement('div');t.id='buddeToast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(window.__buddeToastTimer);window.__buddeToastTimer=setTimeout(()=>t.classList.remove('show'),2200)}
function openBudgetModal(){
  const current=budgetFor(currentCard(),selectedYM);
  budgetModalMonth.textContent=budgetLabel();
  budgetModalCurrent.textContent=euro(current);
  budgetModalInput.value=current?String(current.toFixed(2)):'';
  document.querySelector('input[name="budgetScope"][value="month"]').checked=true;
  budgetModalMsg.textContent='';
  budgetModal.classList.add('open');
  setTimeout(()=>budgetModalInput.focus(),80);
}
function closeBudgetModal(){budgetModal.classList.remove('open')}
function saveBudgetFromModal(){
  const raw=String(budgetModalInput.value||'').replace(',','.');
  const amount=Number(raw);
  if(!Number.isFinite(amount)||amount<0){budgetModalMsg.textContent='Montant invalide';return}
  const cardId=currentCard();
  db.budgets??={};db.budgets[cardId]??={};db.budgetRules??=[];
  const scope=document.querySelector('input[name="budgetScope"]:checked')?.value||'month';
  if(scope==='future'){
    Object.keys(db.budgets[cardId]).forEach(k=>{if(k>=selectedYM)delete db.budgets[cardId][k]});
    db.budgetRules=db.budgetRules.filter(r=>!(r.cardId===cardId&&r.startMonth>=selectedYM));
    db.budgetRules.push({cardId,startMonth:selectedYM,amount});
    budgetMsg.textContent='Budget modifié à partir de '+budgetLabel()+'.';
  }else{
    db.budgets[cardId][selectedYM]=amount;
    budgetMsg.textContent='Budget modifié uniquement pour '+budgetLabel()+'.';
  }
  save(true);render();closeBudgetModal();showToast('Budget mis à jour');
}
openBudgetEditor.onclick=openBudgetModal;openBudgetEditor.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openBudgetModal()}};
openBudgetFromTab.onclick=openBudgetModal;
cancelBudgetEdit.onclick=closeBudgetModal;confirmBudgetEdit.onclick=saveBudgetFromModal;
budgetModal.onclick=e=>{if(e.target===budgetModal)closeBudgetModal()};
function initGoogleDriveBlock(){const authButton=document.getElementById('googleAuthButton'),entryGoogleButton=document.getElementById('entryGoogleButton'),entryOfflineButton=document.getElementById('entryOfflineButton'),backupButton=document.getElementById('googleDriveBackupButton'),restoreButton=document.getElementById('googleDriveRestoreButton'),backupStatus=document.getElementById('googleDriveBackupStatus'),backupButtons=document.querySelectorAll('#googleDriveBackupButton');if(backupButtons.length!==1){const message=backupButtons.length?'Erreur Google Drive : plusieurs boutons de sauvegarde détectés.':'Erreur Google Drive : bouton de sauvegarde introuvable.';console.error(message,{count:backupButtons.length});if(backupStatus)backupStatus.textContent=message;return}if(backupButton)backupButton.addEventListener('click',backupToGoogleDrive);if(restoreButton)restoreButton.addEventListener('click',restoreFromGoogleDrive);if(entryOfflineButton)entryOfflineButton.addEventListener('click',()=>{openAppFromEntry({offline:true});showToast('Mode hors ligne activé')});if(entryGoogleButton)entryGoogleButton.addEventListener('click',async()=>{if(!window.GoogleAuthService){setEntryStatus('Connexion Google indisponible.');return}try{setEntryStatus('Connexion Google en cours…');await GoogleAuthService.signIn();if(GoogleAuthService.isSignedIn()){openAppFromEntry({offline:false});checkGoogleDriveStartupSync()}else setEntryStatus('Connexion Google non finalisée. Vous pouvez accéder hors ligne.')}catch(error){console.warn('Connexion Google depuis l’écran d’entrée interrompue.',error);setEntryStatus('Connexion Google interrompue. Vous pouvez accéder hors ligne.')}});if(!window.GoogleAuthService){renderGoogleAuthStatus();showEntryGate();return}GoogleAuthService.onChange(()=>{if(GoogleAuthService.isSignedIn())offlineEntryMode=false;renderGoogleAuthStatus();if(GoogleAuthService.isSignedIn()){openAppFromEntry({offline:false});checkGoogleDriveStartupSync()}else updateEntryGate()});GoogleAuthService.init().catch(error=>{console.warn('Initialisation Google Auth impossible.',error);renderGoogleAuthStatus()}).then(()=>{renderGoogleAuthStatus();updateEntryGate()});if(authButton){authButton.addEventListener('click',async()=>{try{if(GoogleAuthService.isSignedIn())GoogleAuthService.signOut();else await GoogleAuthService.signIn();if(GoogleAuthService.isSignedIn())offlineEntryMode=false}catch(error){console.warn('Connexion Google interrompue.',error)}renderGoogleAuthStatus();checkGoogleDriveStartupSync()})}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initGoogleDriveBlock,{once:true});else initGoogleDriveBlock()
saveExpense.onclick=saveExpenseForm;cancelExpense.onclick=()=>expenseModal.classList.remove('open');exportJson.onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='Budde.data.json';a.click()};importJson.onchange=async e=>{let f=e.target.files[0];if(!f)return;db=normalizeDb(JSON.parse(await f.text()));selectedYM=db.currentMonth||selectedYM;save(true);render()};render();


// Budd€ 1.0 — enregistrement PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
