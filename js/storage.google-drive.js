const GoogleDriveAdapter={
  FILE_NAME:'budde-data.json',
  DRIVE_API:'https://www.googleapis.com/drive/v3',
  APPDATA_FOLDER:'appDataFolder',
  getBackendName(){
    return 'google-drive';
  },
  load(){
    throw new Error('GoogleDriveAdapter.load is not implemented yet. Google Drive restore is not active.');
  },
  async save(db){
    const token=this.getAccessToken();
    const existing=await this.findBackupFile(token);
    if(existing?.id){
      return this.updateBackupFile(token,existing.id,db);
    }
    return this.createBackupFile(token,db);
  },
  clear(){
    throw new Error('GoogleDriveAdapter.clear is not implemented yet. Google Drive storage is backup-only.');
  },
  getAccessToken(){
    if(!window.GoogleAuthService){
      throw new Error('Google Auth est indisponible. Connectez-vous à Google avant de sauvegarder.');
    }
    const token=GoogleAuthService.getAccessToken();
    if(!token){
      throw new Error('Vous devez être connecté à Google pour sauvegarder sur Drive.');
    }
    return token;
  },
  async findBackupFile(token){
    const query=[
      `name = '${this.escapeDriveQuery(this.FILE_NAME)}'`,
      `'${this.APPDATA_FOLDER}' in parents`,
      'trashed = false'
    ].join(' and ');
    const params=new URLSearchParams({
      spaces:this.APPDATA_FOLDER,
      q:query,
      fields:'files(id,name,modifiedTime)',
      pageSize:'1'
    });
    const response=await fetch(`${this.DRIVE_API}/files?${params.toString()}`,{
      headers:{Authorization:`Bearer ${token}`}
    });
    const body=await this.parseDriveResponse(response);
    if(!response.ok){
      throw new Error(this.driveErrorMessage(body,'Recherche de la sauvegarde Google Drive impossible.'));
    }
    return body.files?.[0]||null;
  },
  async createBackupFile(token,db){
    return this.uploadMultipart(token,`${this.DRIVE_API}/files?uploadType=multipart&fields=id,name,modifiedTime`,{
      name:this.FILE_NAME,
      parents:[this.APPDATA_FOLDER],
      mimeType:'application/json'
    },db,'POST');
  },
  async updateBackupFile(token,fileId,db){
    return this.uploadMultipart(token,`${this.DRIVE_API}/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,name,modifiedTime`,{
      name:this.FILE_NAME,
      mimeType:'application/json'
    },db,'PATCH');
  },
  async uploadMultipart(token,url,metadata,db,method){
    const boundary=`budde_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const body=[
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(db,null,2),
      `--${boundary}--`,
      ''
    ].join('\r\n');
    const response=await fetch(url,{
      method,
      headers:{
        Authorization:`Bearer ${token}`,
        'Content-Type':`multipart/related; boundary=${boundary}`
      },
      body
    });
    const responseBody=await this.parseDriveResponse(response);
    if(!response.ok){
      throw new Error(this.driveErrorMessage(responseBody,'Sauvegarde Google Drive impossible.'));
    }
    return responseBody;
  },
  async parseDriveResponse(response){
    const text=await response.text();
    if(!text) return {};
    try{return JSON.parse(text)}catch(error){return {error:{message:text}}}
  },
  driveErrorMessage(body,fallback){
    const message=body?.error?.message||body?.error_description||body?.message;
    return message?`${fallback} ${message}`:fallback;
  },
  escapeDriveQuery(value){
    return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  }
};
