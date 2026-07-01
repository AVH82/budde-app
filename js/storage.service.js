const StorageService=(()=>{
  const backend=LocalStorageAdapter;
  const backendName='LocalStorageAdapter';

  return {
    load(normalizeDb,defaultDb){
      return backend.load(normalizeDb,defaultDb);
    },
    save(db){
      backend.save(db);
    },
    clear(){
      backend.clear();
    },
    getBackendName(){
      return backendName;
    }
  };
})();
