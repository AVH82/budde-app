const GoogleDriveAdapter={
  FILE_NAME:'budde-data.json',
  FILE_ID_STORAGE_KEY:'budde-google-drive-file-id-v2',
  DIAGNOSTIC_STORAGE_KEY:'budde-google-drive-file-diagnostic-v1',
  DRIVE_API:'https://www.googleapis.com/drive/v3',
  DRIVE_UPLOAD_API:'https://www.googleapis.com/upload/drive/v3',
  APPDATA_FOLDER:'appDataFolder',
  getBackendName(){return 'google-drive'},
  getCanonicalFileId(){try{return localStorage.getItem(this.FILE_ID_STORAGE_KEY)||''}catch(error){return ''}},
  setCanonicalFileId(fileId){if(!fileId)return;try{localStorage.setItem(this.FILE_ID_STORAGE_KEY,String(fileId))}catch(error){}},
  clearCanonicalFileId(){try{localStorage.removeItem(this.FILE_ID_STORAGE_KEY)}catch(error){}},
  stableSnapshot(db){return JSON.stringify({updatedAt:db?.updatedAt||null,budgets:db?.budgets||{},budgetRules:Array.isArray(db?.budgetRules)?db.budgetRules:[],expenses:Array.isArray(db?.expenses)?db.expenses:[]})},
  diagnosticBudget(data){const cardId=data?.currentCardId||data?.cards?.[0]?.id||'';const month=data?.currentMonth||'';const amount=cardId&&month?data?.budgets?.[cardId]?.[month]:undefined;return {cardId,month,amount:amount==null?null:Number(amount)}},
  getDiagnosticHistory(){try{const value=JSON.parse(localStorage.getItem(this.DIAGNOSTIC_STORAGE_KEY)||'[]');return Array.isArray(value)?value:[]}catch(error){return []}},
  recordDiagnostic(operation,{fileId='',modifiedTime=null,data=null,source='' }={}){
    const budget=this.diagnosticBudget(data);
    const entry={operation,fileId:String(fileId||''),modifiedTime:modifiedTime||null,updatedAt:data?.updatedAt||null,expenses:Array.isArray(data?.expenses)?data.expenses.length:0,budget,source,recordedAt:new Date().toISOString()};
    const history=[entry,...this.getDiagnosticHistory()].slice(0,10);
    try{localStorage.setItem(this.DIAGNOSTIC_STORAGE_KEY,JSON.stringify(history))}catch(error){}
    console.info('Google Drive : diagnostic fichier.',entry);
    this.renderDiagnostic(history);
    window.dispatchEvent(new CustomEvent('budde:google-drive-diagnostic',{detail:entry}));
    return entry;
  },
  renderDiagnostic(history=this.getDiagnosticHistory()){
    if(typeof document==='undefined')return;
    const box=document.querySelector('.googleAuthBox');
    if(!box)return;
    let panel=document.getElementById('googleDriveFileDiagnostic');
    if(!panel){panel=document.createElement('div');panel.id='googleDriveFileDiagnostic';panel.className='systemDiagnostic';panel.innerHTML='<h4>Diagnostic fichier Google Drive</h4><p class="driveBackupStatus">Compare les identifiants utilisés par la dernière sauvegarde et la dernière restauration.</p><div id="googleDriveFileDiagnosticRows"></div>';box.appendChild(panel)}
    const rows=document.getElementById('googleDriveFileDiagnosticRows');
    if(!rows)return;
    const latestSave=history.find(item=>item.operation==='sauvegarde');
    const latestLoad=history.find(item=>item.operation==='restauration');
    const format=item=>{if(!item)return 'Aucune opération enregistrée';const budget=item.budget?.month?` • ${item.budget.month} : ${item.budget.amount==null?'hérité':`${item.budget.amount} €`}`:'';return `${item.fileId||'ID absent'} • Drive ${item.modifiedTime||'date inconnue'} • JSON ${item.updatedAt||'date inconnue'}${budget}`};
    const verdict=latestSave&&latestLoad?(latestSave.fileId===latestLoad.fileId?'Même fichier utilisé':'FICHIERS DIFFÉRENTS DÉTECTÉS'):'Comparaison en attente';
    rows.innerHTML=`<dl class="settingsStatus systemStatus diagnosticStatus"><div><dt>Dernière sauvegarde</dt><dd>${format(latestSave)}</dd></div><div><dt>Dernière restauration</dt><dd>${format(latestLoad)}</dd></div><div><dt>Comparaison</dt><dd>${verdict}</dd></div></dl>`;
  },
  async load(){
    const token=await this.getAccessToken();
    const canonicalId=this.getCanonicalFileId();
    if(canonicalId){
      try{
        const metadata=await this.getFileMetadata(token,canonicalId);
        const data=await this.downloadFileById(token,canonicalId);
        this.recordDiagnostic('restauration',{fileId:canonicalId,modifiedTime:metadata?.modifiedTime,data,source:'canonique local'});
        console.info('Google Drive : restauration depuis le fichier canonique.',{id:canonicalId,modifiedTime:metadata?.modifiedTime,updatedAt:data?.updatedAt});
        return data;
      }catch(error){
        if(error?.status!==404)throw error;
        this.clearCanonicalFileId();
      }
    }
    const existing=await this.findBackupFile(token);
    if(!existing?.id)throw new Error('Aucune sauvegarde Google Drive trouvée.');
    this.setCanonicalFileId(existing.id);
    const data=await this.downloadFileById(token,existing.id);
    this.recordDiagnostic('restauration',{fileId:existing.id,modifiedTime:existing.modifiedTime,data,source:'recherche Drive'});
    console.info('Google Drive : restauration depuis le fichier sélectionné.',{id:existing.id,modifiedTime:existing.modifiedTime,updatedAt:data?.updatedAt});
    return data;
  },
  async save(db){
    const token=await this.getAccessToken();
    let targetId=this.getCanonicalFileId();
    if(targetId){
      try{await this.getFileMetadata(token,targetId)}catch(error){if(error?.status!==404)throw error;this.clearCanonicalFileId();targetId=''}
    }
    if(!targetId){const existing=await this.findBackupFile(token);targetId=existing?.id||''}
    const result=targetId?await this.updateBackupFile(token,targetId,db):await this.createBackupFile(token,db);
    if(!result?.id)throw new Error('Sauvegarde Google Drive non vérifiable : identifiant de fichier absent.');
    this.setCanonicalFileId(result.id);
    const downloaded=await this.downloadFileById(token,result.id);
    if(this.stableSnapshot(downloaded)!==this.stableSnapshot(db))throw new Error('Vérification Google Drive échouée : le fichier écrit ne correspond pas aux données locales.');
    this.recordDiagnostic('sauvegarde',{fileId:result.id,modifiedTime:result.modifiedTime,data:downloaded,source:targetId?'mise à jour':'création'});
    console.info('Google Drive : sauvegarde vérifiée sur le fichier exact.',{id:result.id,modifiedTime:result.modifiedTime,updatedAt:downloaded?.updatedAt,budgets:downloaded?.budgets,expenses:downloaded?.expenses?.length||0});
    return {...result,verified:true,verifiedUpdatedAt:downloaded?.updatedAt||null};
  },
  clear(){throw new Error('GoogleDriveAdapter.clear is not implemented yet. Google Drive storage is backup-only.')},
  async getAccessToken(){
    if(!window.GoogleAuthService)throw new Error('Google Auth est indisponible. Connectez-vous à Google avant de sauvegarder.');
    const token=GoogleAuthService.ensureAccessToken?await GoogleAuthService.ensureAccessToken():GoogleAuthService.getAccessToken();
    if(!token)throw new Error('Vous devez être connecté à Google pour sauvegarder sur Drive.');
    return token;
  },
  async getFileMetadata(token,fileId){
    const params=new URLSearchParams({fields:'id,name,modifiedTime'});
    const response=await fetch(`${this.DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`,{headers:{Authorization:`Bearer ${token}`}});
    const body=await this.parseDriveResponse(response);
    if(!response.ok){const error=new Error(this.driveErrorMessage(body,'Lecture des métadonnées Google Drive impossible.'));error.status=response.status;throw error}
    return body;
  },
  async downloadFileById(token,fileId){
    const params=new URLSearchParams({alt:'media'});
    const response=await fetch(`${this.DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`,{headers:{Authorization:`Bearer ${token}`}});
    const text=await response.text();
    if(!response.ok){let body;try{body=text?JSON.parse(text):{}}catch(error){body={error:{message:text}}}const failure=new Error(this.driveErrorMessage(body,'Téléchargement de la sauvegarde Google Drive impossible.'));failure.status=response.status;throw failure}
    try{return JSON.parse(text)}catch(error){throw new Error('Sauvegarde Google Drive invalide : JSON illisible.')}
  },
  async findBackupFile(token){
    const query=[`name = '${this.escapeDriveQuery(this.FILE_NAME)}'`,`'${this.APPDATA_FOLDER}' in parents`,'trashed = false'].join(' and ');
    const params=new URLSearchParams({spaces:this.APPDATA_FOLDER,q:query,fields:'files(id,name,modifiedTime)',orderBy:'modifiedTime desc',pageSize:'100'});
    const response=await fetch(`${this.DRIVE_API}/files?${params.toString()}`,{headers:{Authorization:`Bearer ${token}`}});
    const body=await this.parseDriveResponse(response);
    if(!response.ok)throw new Error(this.driveErrorMessage(body,'Recherche de la sauvegarde Google Drive impossible.'));
    const files=body.files||[];
    if(files.length>1)console.warn('Google Drive : plusieurs sauvegardes détectées.',{selected:files[0],duplicates:files.slice(1)});
    return files[0]||null;
  },
  async createBackupFile(token,db){return this.uploadMultipart(token,`${this.DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime`,{name:this.FILE_NAME,parents:[this.APPDATA_FOLDER],mimeType:'application/json'},db,'POST')},
  async updateBackupFile(token,fileId,db){return this.uploadMultipart(token,`${this.DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,name,modifiedTime`,{name:this.FILE_NAME,mimeType:'application/json'},db,'PATCH')},
  async uploadMultipart(token,url,metadata,db,method){
    const boundary=`budde_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const body=[`--${boundary}`,'Content-Type: application/json; charset=UTF-8','',JSON.stringify(metadata),`--${boundary}`,'Content-Type: application/json; charset=UTF-8','',JSON.stringify(db,null,2),`--${boundary}--`,''].join('\r\n');
    const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':`multipart/related; boundary=${boundary}`},body});
    const responseBody=await this.parseDriveResponse(response);
    if(!response.ok)throw new Error(this.driveErrorMessage(responseBody,'Sauvegarde Google Drive impossible.'));
    return responseBody;
  },
  async parseDriveResponse(response){const text=await response.text();if(!text)return {};try{return JSON.parse(text)}catch(error){return {error:{message:text}}}},
  driveErrorMessage(body,fallback){const message=body?.error?.message||body?.error_description||body?.message;return message?`${fallback} ${message}`:fallback},
  escapeDriveQuery(value){return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
};

window.GoogleDriveAdapter=GoogleDriveAdapter;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>GoogleDriveAdapter.renderDiagnostic(),{once:true});else GoogleDriveAdapter.renderDiagnostic();