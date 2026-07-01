const GoogleDriveAdapter={
  getBackendName(){
    return 'google-drive';
  },
  load(){
    throw new Error('GoogleDriveAdapter is not configured yet. Google Drive storage is not active.');
  },
  save(){
    throw new Error('GoogleDriveAdapter is not configured yet. Google Drive storage is not active.');
  },
  clear(){
    throw new Error('GoogleDriveAdapter is not configured yet. Google Drive storage is not active.');
  }
};
