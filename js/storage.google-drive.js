const GoogleDriveAdapter={
  FILE_NAME:'budde-data.json',
  FILE_ID_STORAGE_KEY:'budde-google-drive-file-id-v2',
  DRIVE_API:'https://www.googleapis.com/drive/v3',
  DRIVE_UPLOAD_API:'https://www.googleapis.com/upload/drive/v3',
  APPDATA_FOLDER:'appDataFolder',
  getBackendName(){return 'google-drive'},
  getCanonicalFileId(){try{return localStorage.getItem(this.FILE_ID_STORAGE_KEY)||''}catch(error){return ''}},
  setCanonicalFileId(fileId){if(!fileId)return;try{localStorage.setItem(this.FILE_ID_STORAGE_KEY,String(fileId))}catch(error){}},
  clearCanonicalFileId(){try{localStorage.removeItem(this.FILE_ID_STORAGE_KEY)}catch(error){}},
  stableSnapshot(db){return JSON.stringify({updatedAt:db?.updatedAt||null,budgets:db?.budgets||{},budgetRules:Array.isArray(db?.budgetRules)?db.budgetRules:[],expenses:Array.isArray(db?.expenses)?db.expenses:[]})},
  parseTimestamp(value){const time=Date.parse(value||'');return Number.isFinite(time)?time:0},
  async listBackupFiles(token){
    const query=[`name = '${this.escapeDriveQuery(this.FILE_NAME)}'`,`'${this.APPDATA_FOLDER}' in parents`,'trashed = false'].join(' and ');
    const params=new URLSearchParams({spaces:this.APPDATA_FOLDER,q:query,fields:'files(id,name,modifiedTime)',orderBy:'modifiedTime desc',pageSize:'100'});
    const response=await fetch(`${this.DRIVE_API}/files?${params.toString()}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
    const body=await this.parseDriveResponse(response);
    if(!response.ok)throw new Error(this.driveErrorMessage(body,'Recherche de la sauvegarde Google Drive impossible.'));
    return body.files||[];
  },
  async inspectBackupFiles(token){
    const files=await this.listBackupFiles(token);
    const inspected=[];
    for(const file of files){
      try{const data=await this.downloadFileById(token,file.id);inspected.push({...file,data,updatedAt:data?.updatedAt||null})}
      catch(error){}
    }
    inspected.sort((a,b)=>{const byJson=this.parseTimestamp(b.updatedAt)-this.parseTimestamp(a.updatedAt);if(byJson!==0)return byJson;return this.parseTimestamp(b.modifiedTime)-this.parseTimestamp(a.modifiedTime)});
    return inspected;
  },
  async load(){
    const token=await this.getAccessToken();
    const candidates=await this.inspectBackupFiles(token);
    if(!candidates.length)throw new Error('Aucune sauvegarde Google Drive trouvée.');
    const selected=candidates[0];
    this.setCanonicalFileId(selected.id);
    return selected.data;
  },
  async save(db){
    const token=await this.getAccessToken();
    let targetId=this.getCanonicalFileId();
    if(targetId){try{await this.getFileMetadata(token,targetId)}catch(error){if(error?.status!==404)throw error;this.clearCanonicalFileId();targetId=''}}
    if(!targetId){const existing=(await this.inspectBackupFiles(token))[0];targetId=existing?.id||''}
    const result=targetId?await this.updateBackupFile(token,targetId,db):await this.createBackupFile(token,db);
    if(!result?.id)throw new Error('Sauvegarde Google Drive non vérifiable : identifiant de fichier absent.');
    this.setCanonicalFileId(result.id);
    const downloaded=await this.downloadFileById(token,result.id);
    if(this.stableSnapshot(downloaded)!==this.stableSnapshot(db))throw new Error('Vérification Google Drive échouée : le fichier écrit ne correspond pas aux données locales.');
    return {...result,verified:true,verifiedUpdatedAt:downloaded?.updatedAt||null};
  },
  clear(){throw new Error('GoogleDriveAdapter.clear is not implemented yet. Google Drive storage is backup-only.')},
  async getAccessToken(){if(!window.GoogleAuthService)throw new Error('Google Auth est indisponible. Connectez-vous à Google avant de sauvegarder.');const token=GoogleAuthService.ensureAccessToken?await GoogleAuthService.ensureAccessToken():GoogleAuthService.getAccessToken();if(!token)throw new Error('Vous devez être connecté à Google pour sauvegarder sur Drive.');return token},
  async getFileMetadata(token,fileId){const params=new URLSearchParams({fields:'id,name,modifiedTime'});const response=await fetch(`${this.DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});const body=await this.parseDriveResponse(response);if(!response.ok){const error=new Error(this.driveErrorMessage(body,'Lecture des métadonnées Google Drive impossible.'));error.status=response.status;throw error}return body},
  async downloadFileById(token,fileId){const params=new URLSearchParams({alt:'media',buddeNonce:`${Date.now()}-${Math.random().toString(36).slice(2)}`});const response=await fetch(`${this.DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`,{headers:{Authorization:`Bearer ${token}`,'Cache-Control':'no-cache'},cache:'no-store'});const text=await response.text();if(!response.ok){let body;try{body=text?JSON.parse(text):{}}catch(error){body={error:{message:text}}}const failure=new Error(this.driveErrorMessage(body,'Téléchargement de la sauvegarde Google Drive impossible.'));failure.status=response.status;throw failure}try{return JSON.parse(text)}catch(error){throw new Error('Sauvegarde Google Drive invalide : JSON illisible.')}},
  async findBackupFile(token){return (await this.listBackupFiles(token))[0]||null},
  async createBackupFile(token,db){return this.uploadMultipart(token,`${this.DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime`,{name:this.FILE_NAME,parents:[this.APPDATA_FOLDER],mimeType:'application/json'},db,'POST')},
  async updateBackupFile(token,fileId,db){return this.uploadMultipart(token,`${this.DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,name,modifiedTime`,{name:this.FILE_NAME,mimeType:'application/json'},db,'PATCH')},
  async uploadMultipart(token,url,metadata,db,method){const boundary=`budde_${Date.now()}_${Math.random().toString(36).slice(2)}`;const body=[`--${boundary}`,'Content-Type: application/json; charset=UTF-8','',JSON.stringify(metadata),`--${boundary}`,'Content-Type: application/json; charset=UTF-8','',JSON.stringify(db,null,2),`--${boundary}--`,''].join('\r\n');const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':`multipart/related; boundary=${boundary}`},body,cache:'no-store'});const responseBody=await this.parseDriveResponse(response);if(!response.ok)throw new Error(this.driveErrorMessage(responseBody,'Sauvegarde Google Drive impossible.'));return responseBody},
  async parseDriveResponse(response){const text=await response.text();if(!text)return {};try{return JSON.parse(text)}catch(error){return {error:{message:text}}}},
  driveErrorMessage(body,fallback){const message=body?.error?.message||body?.error_description||body?.message;return message?`${fallback} ${message}`:fallback},
  escapeDriveQuery(value){return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
};

window.GoogleDriveAdapter=GoogleDriveAdapter;
