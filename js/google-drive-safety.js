(()=>{
  const STORAGE_KEY='budde-data-v1';

  function readLocalDb(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(error){return null}
  }

  function stableSnapshot(db){
    return JSON.stringify({
      updatedAt:db?.updatedAt||null,
      budgets:db?.budgets||{},
      budgetRules:Array.isArray(db?.budgetRules)?db.budgetRules:[],
      expenses:Array.isArray(db?.expenses)?db.expenses:[]
    });
  }

  function formatDate(value){
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'date inconnue':new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'medium'}).format(date);
  }

  function setText(id,message){const element=document.getElementById(id);if(element)element.textContent=message}

  const adapter=window.GoogleDriveAdapter;
  if(adapter&&!adapter.__verifiedBackupPatched){
    const originalSave=adapter.save.bind(adapter);
    adapter.save=async function verifiedSave(db){
      const result=await originalSave(db);
      const downloaded=await adapter.load();
      if(stableSnapshot(downloaded)!==stableSnapshot(db)){
        throw new Error('Vérification Google Drive échouée : le fichier relu ne correspond pas aux données locales.');
      }
      console.info('Google Drive : sauvegarde vérifiée après relecture.',{
        updatedAt:downloaded?.updatedAt,
        expenses:downloaded?.expenses?.length||0
      });
      return {...result,verified:true,verifiedUpdatedAt:downloaded?.updatedAt||null};
    };
    adapter.__verifiedBackupPatched=true;
  }

  const restoreButton=document.getElementById('googleDriveRestoreButton');
  if(restoreButton){
    restoreButton.addEventListener('click',async event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      if(!window.GoogleAuthService?.isSignedIn?.()){
        setText('googleDriveRestoreStatus','Vous devez être connecté à Google pour restaurer depuis Drive.');
        return;
      }
      try{
        restoreButton.disabled=true;
        setText('googleDriveRestoreStatus','Lecture de la sauvegarde Google Drive…');
        await GoogleAuthService.ensureAccessToken();
        const driveDb=await GoogleDriveAdapter.load();
        const localDb=readLocalDb();
        const localTime=Date.parse(localDb?.updatedAt||'');
        const driveTime=Date.parse(driveDb?.updatedAt||'');
        const driveOlder=Number.isFinite(localTime)&&Number.isFinite(driveTime)&&driveTime<localTime;
        const details=`Locale : ${formatDate(localDb?.updatedAt)}\nGoogle Drive : ${formatDate(driveDb?.updatedAt)}`;
        const question=driveOlder
          ? `ATTENTION : la sauvegarde Google Drive est plus ancienne que les données locales.\n${details}\n\nÉcraser malgré tout les données locales ?`
          : `Remplacer les données locales par la sauvegarde Google Drive ?\n${details}`;
        if(!confirm(question)){
          setText('googleDriveRestoreStatus','Restauration annulée — données locales conservées.');
          return;
        }
        localStorage.setItem(STORAGE_KEY,JSON.stringify(driveDb));
        setText('googleDriveRestoreStatus',`Restauration terminée — sauvegarde Drive du ${formatDate(driveDb?.updatedAt)}.`);
        location.reload();
      }catch(error){
        console.error('Restauration Google Drive sécurisée impossible.',error);
        setText('googleDriveRestoreStatus',error?.message||'Erreur pendant la restauration Google Drive.');
      }finally{
        restoreButton.disabled=false;
      }
    },true);
  }
})();
