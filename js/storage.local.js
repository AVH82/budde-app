const LocalStorageAdapter={
  STORAGE_KEY:'budde-data-v1',
  LEGACY_KEY:'budde-v7',
  load(normalizeDb,defaultDb){
    try{
      const current=localStorage.getItem(this.STORAGE_KEY);
      if(current) return normalizeDb(JSON.parse(current));
      const legacy=localStorage.getItem(this.LEGACY_KEY);
      if(legacy){
        const migrated=normalizeDb(JSON.parse(legacy));
        this.save(migrated);
        return migrated;
      }
    }catch(e){console.warn('Budd€: données locales illisibles',e)}
    return normalizeDb(defaultDb);
  },
  save(db){
    localStorage.setItem(this.STORAGE_KEY,JSON.stringify(db));
  },
  clear(){
    localStorage.removeItem(this.STORAGE_KEY);
  }
};
