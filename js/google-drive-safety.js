(()=>{
  const STORAGE_KEY='budde-data-v1';
  const CANONICAL_FILE_KEY='budde-google-drive-file-id-v1';

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
  function getCanonicalFileId(){return localStorage.getItem(CANONICAL_FILE_KEY)||''}
  function setCanonicalFileId(fileId){if(fileId)localStorage.setItem(CANONICAL_FILE_KEY,String(fileId))}
  function clearCanonicalFileId(){localStorage.removeItem(CANONICAL_FILE_KEY)}

  const adapter=window.GoogleDriveAdapter;
  if(adapter&&!adapter.__canonicalFilePatched){
    const originalSave=adapter.save.bind(adapter);
    const originalLoad=adapter.load.bind(adapter);

    async function downloadFileById(fileId){
      const token=await adapter.getAccessToken();
      const params=new URLSearchParams({alt:'media'});
      const response=await fetch(`${adapter.DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`,{
        headers:{Authorization:`Bearer ${token}`}
      });
      const text=await response.text();
      if(!response.ok){
        let body;
        try{body=text?JSON.parse(text):{}}catch(error){body={error:{message:text}}}
        const message=adapter.driveErrorMessage(body,'Téléchargement de la sauvegarde Google Drive impossible.');
        const error=new Error(message);
        error.status=response.status;
        throw error;
      }
      try{return JSON.parse(text)}catch(error){throw new Error('Sauvegarde Google Drive invalide : JSON illisible.')}
    }

    adapter.load=async function canonicalLoad(){
      const canonicalId=getCanonicalFileId();
      if(canonicalId){
        try{
          const data=await downloadFileById(canonicalId);
          console.info('Google Drive : chargement du fichier canonique.',{id:canonicalId,updatedAt:data?.updatedAt});
          return data;
        }catch(error){
          if(error?.status===404){
            clearCanonicalFileId();
            console.warn('Google Drive : fichier canonique introuvable, retour à la recherche par nom.',{id:canonicalId});
          }else throw error;
        }
      }
      return originalLoad();
    };

    adapter.save=async function verifiedSave(db){
      const result=await originalSave(db);
      if(!result?.id)throw new Error('Sauvegarde Google Drive non vérifiable : identifiant de fichier absent.');
      setCanonicalFileId(result.id);
      const downloaded=await downloadFileById(result.id);
      if(stableSnapshot(downloaded)!==stableSnapshot(db)){
        throw new Error('Vérification Google Drive échouée : le fichier écrit ne correspond pas aux données locales.');
      }
      console.info('Google Drive : sauvegarde vérifiée sur le fichier exact.',{
        id:result.id,
        updatedAt:downloaded?.updatedAt,
        expenses:downloaded?.expenses?.length||0
      });
      return {...result,verified:true,verifiedUpdatedAt:downloaded?.updatedAt||null};
    };
    adapter.__canonicalFilePatched=true;
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
