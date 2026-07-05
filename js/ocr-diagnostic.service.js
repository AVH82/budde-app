(function(){
  const DIAGNOSTIC_KEY='budde.ocrDiagnostics.v1';
  const TICKET_KEY='budde.tickets.v1';
  const RETENTION_KEY='budde.retention.v1';
  const RETENTION_DAYS={months3:92,months6:183,months12:366};
  const textEncoder=new TextEncoder();
  function now(){return new Date().toISOString()}
  function loadKey(key){try{const value=localStorage.getItem(key);return value?JSON.parse(value):[]}catch(error){console.warn('Archive locale illisible.',error);return []}}
  function saveKey(key,items){localStorage.setItem(key,JSON.stringify(items))}
  function getRetentionMode(){return localStorage.getItem(RETENTION_KEY)||'manual'}
  function setRetentionMode(mode){localStorage.setItem(RETENTION_KEY,['months3','months6','months12','manual'].includes(mode)?mode:'manual');purge()}
  function cutoff(){const days=RETENTION_DAYS[getRetentionMode()];return days?Date.now()-days*24*60*60*1000:null}
  function byteLength(value){return new Blob([typeof value==='string'?value:JSON.stringify(value||{})]).size}
  function blobToDataUrl(blob){return new Promise(resolve=>{if(!blob){resolve(null);return}const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>resolve(null);reader.readAsDataURL(blob)})}
  function dataUrlBytes(dataUrl){const b64=String(dataUrl||'').split(',')[1]||'';const bin=atob(b64);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
  function dataUrlSize(dataUrl){try{return dataUrlBytes(dataUrl).length}catch(error){return byteLength(dataUrl)}}
  function safeName(value){return String(value||'archive').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'archive'}
  function fileExt(typeOrBlob,fallback='jpg'){const type=String(typeOrBlob?.type||typeOrBlob||'').split('/').pop();return type&&type.length<8?type:fallback}
  function loadTickets(){return loadKey(TICKET_KEY)}
  function loadDiagnostics(){return loadKey(DIAGNOSTIC_KEY)}
  function saveTickets(items){saveKey(TICKET_KEY,items)}
  function saveDiagnostics(items){saveKey(DIAGNOSTIC_KEY,items)}
  function purge(){const min=cutoff();let tickets=loadTickets(),diagnostics=loadDiagnostics();if(min){tickets=tickets.filter(item=>Date.parse(item.createdAt)>=min);diagnostics=diagnostics.filter(item=>Date.parse(item.createdAt)>=min);saveTickets(tickets);saveDiagnostics(diagnostics)}return {tickets,diagnostics}}
  function ticketStats(){const tickets=purge().tickets;const sizes=tickets.map(item=>Number(item.sizeBytes)||dataUrlSize(item.imageData));const dates=tickets.map(item=>item.createdAt).sort();return {count:tickets.length,totalBytes:sizes.reduce((a,b)=>a+b,0),averageBytes:tickets.length?Math.round(sizes.reduce((a,b)=>a+b,0)/tickets.length):0,oldest:dates[0]||null,newest:dates.at(-1)||null}}
  function diagnosticStats(){const diagnostics=purge().diagnostics;const sizes=diagnostics.map(byteLength);const dates=diagnostics.map(item=>item.createdAt).sort();return {count:diagnostics.length,totalBytes:sizes.reduce((a,b)=>a+b,0),averageBytes:diagnostics.length?Math.round(sizes.reduce((a,b)=>a+b,0)/diagnostics.length):0,oldest:dates[0]||null,newest:dates.at(-1)||null}}
  function stats(){const tickets=ticketStats(),diagnostics=diagnosticStats();const dates=[tickets.oldest,tickets.newest,diagnostics.oldest,diagnostics.newest].filter(Boolean).sort();return {count:diagnostics.count,totalBytes:diagnostics.totalBytes,averageBytes:diagnostics.averageBytes,oldest:diagnostics.oldest,newest:diagnostics.newest,tickets,diagnostics,totalBytes:tickets.totalBytes+diagnostics.totalBytes,retentionMode:getRetentionMode()}}
  function getTicket(id){return purge().tickets.find(item=>item.id===id)||null}
  async function createTicket(payload={}){const file=payload.file||payload.rawPhoto||payload.imageBlob;if(!file)return null;const imageData=payload.imageData||await blobToDataUrl(file);if(!imageData)return null;const existing=loadTickets().find(item=>item.imageData===imageData);if(existing)return existing;const createdAt=now();const id=`ticket-${createdAt.replace(/[:.]/g,'-')}-${Math.random().toString(36).slice(2,8)}`;const ticket={id,createdAt,imageData,mimeType:file.type||payload.mimeType||'image/jpeg',sizeBytes:file.size||dataUrlSize(imageData),source:'scanner',linkedExpenseId:payload.linkedExpenseId||null,metadata:{name:file.name||'ticket',appVersion:payload.appVersion||null,buildId:payload.buildId||null,userAgent:navigator.userAgent,...(payload.metadata||{})}};const tickets=loadTickets();tickets.push(ticket);saveTickets(tickets);purge();return ticket}
  function linkTicket(ticketId,expenseId){const tickets=loadTickets();const ticket=tickets.find(item=>item.id===ticketId);if(ticket&&!ticket.linkedExpenseId){ticket.linkedExpenseId=expenseId;saveTickets(tickets)}return ticket||null}
  async function create(payload={}){const items=purge().diagnostics;const createdAt=now();const id=`ocr-${createdAt.replace(/[:.]/g,'-')}-${Math.random().toString(36).slice(2,8)}`;const record={id,createdAt,ticketId:payload.ticketId||null,rawOcr:payload.rawOcr||null,buddyResult:payload.buddyResult||null,userCorrections:payload.userCorrections||{},trustScore:Number(payload.trustScore??payload.buddyResult?.trust)||0,metadata:{appVersion:payload.appVersion||null,buildId:payload.buildId||null,userAgent:navigator.userAgent,createdAt,...(payload.metadata||{})}};items.push(record);saveDiagnostics(items);purge();return record}
  function clear(){saveDiagnostics([])}
  function clearTickets(){saveTickets([])}
  function clearAll(){clear();clearTickets()}
  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  let crcTable=null;function crc32(bytes){crcTable=crcTable||Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
  function u16(n){return [n&255,(n>>>8)&255]}function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
  function zipDate(date){const d=new Date(date);return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()/2),date:((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}}
  function addJson(files,path,data){files.push({path,bytes:textEncoder.encode(JSON.stringify(data,null,2))})}
  function buildFiles(items){const files=[];items.forEach(item=>{const dir=`${safeName(item.createdAt)}-${safeName(item.id)}`;addJson(files,`${dir}/diagnostic.json`,item)});return files}
  function makeZip(files){let offset=0;const local=[],central=[];for(const file of files){const name=textEncoder.encode(file.path),bytes=file.bytes,crc=crc32(bytes),dt=zipDate(new Date());local.push(Uint8Array.from([0x50,0x4b,3,4,...u16(20),0,0,0,0,...u16(dt.time),...u16(dt.date),...u32(crc),...u32(bytes.length),...u32(bytes.length),...u16(name.length),0,0,...name,...bytes]));central.push(Uint8Array.from([0x50,0x4b,1,2,...u16(20),...u16(20),0,0,0,0,...u16(dt.time),...u16(dt.date),...u32(crc),...u32(bytes.length),...u32(bytes.length),...u16(name.length),0,0,0,0,0,0,0,0,0,...u32(offset),...name]));offset+=local.at(-1).length}const centralSize=central.reduce((s,x)=>s+x.length,0);return new Blob([...local,...central,Uint8Array.from([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),0,0])],{type:'application/zip'})}
  async function exportZip(){const items=purge().diagnostics;const blob=makeZip(buildFiles(items));downloadBlob(blob,`Budde-diagnostics-OCR-${new Date().toISOString().slice(0,10)}.zip`);return blob}
  window.TicketArchiveService={create:createTicket,get:getTicket,link:linkTicket,stats:ticketStats,clear:clearTickets,purge,getRetentionMode,setRetentionMode};
  window.OcrDiagnosticService={create,stats,clear,clearTickets,clearAll,exportZip,purge,getRetentionMode,setRetentionMode};
})();
