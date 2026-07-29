const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const drive=fs.readFileSync('js/storage.google-drive.js','utf8');
const archive=fs.readFileSync('js/ocr-diagnostic.service.js','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');

test('budget data and Buddy corpus use separate Drive files',()=>{
  assert.match(drive,/FILE_NAME:'budde-data\.json'/);
  assert.match(drive,/INDEX_NAME:'budde-buddy-learning\.json'/);
  assert.match(drive,/RECEIPT_PREFIX:'budde-receipt-'/);
});

test('receipt images are uploaded separately from the Buddy JSON index',()=>{
  assert.match(drive,/async uploadReceipt\(token,ticket\)/);
  assert.match(drive,/tickets:mergedTickets\.map\(ticket=>this\.stripImage\(ticket\)\)/);
  assert.doesNotMatch(drive,/INDEX_NAME[\s\S]{0,300}imageData/);
});

test('local and Drive archives merge by stable identifiers',()=>{
  assert.match(archive,/function mergeById\(localItems=\[\],incomingItems=\[\]\)/);
  assert.match(archive,/function exportSnapshot\(\)/);
  assert.match(archive,/function mergeSnapshot\(snapshot=\{\}\)/);
  assert.match(drive,/OcrDiagnosticService\.mergeSnapshot/);
});

test('normal Drive backup and restore include the Buddy corpus',()=>{
  assert.match(drive,/await BuddyLearningDriveAdapter\.save\(token\)/);
  assert.match(drive,/await BuddyLearningDriveAdapter\.loadAndMerge\(token\)/);
});

test('PWA cache refreshes both synchronization services',()=>{
  assert.match(worker,/buddy-learning-sync-1/);
  assert.match(worker,/\/js\/storage\.google-drive\.js/);
  assert.match(worker,/\/js\/ocr-diagnostic\.service\.js/);
});
