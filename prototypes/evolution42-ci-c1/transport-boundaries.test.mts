import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {digestFile,evidenceDigest,verifyTransport,type TransportAnchor} from './transport.mts';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ui42-transport-boundaries-'));
try {
 const a=path.join(temp,'a'),b=path.join(temp,'b');fs.mkdirSync(a);fs.mkdirSync(b);
 for(const [dir,names] of [[a,['one','two']],[b,['two','one']]] as const)for(const name of names)fs.writeFileSync(path.join(dir,name),name);
 assert.equal(evidenceDigest(a),evidenceDigest(b),'Directory enumeration order must not affect the digest');
 fs.writeFileSync(path.join(b,'two'),'changed');assert.notEqual(evidenceDigest(a),evidenceDigest(b),'Evidence byte changes must alter identity');
 const file=path.join(a,'one');assert.equal(digestFile(file,3).length,64);assert.throws(()=>digestFile(file,2),/byte limit/);
 fs.symlinkSync(file,path.join(b,'link'));assert.throws(()=>evidenceDigest(b),/symlink/);assert.throws(()=>digestFile(path.join(b,'link'),100),/regular file/);fs.unlinkSync(path.join(b,'link'));
 const huge=path.join(b,'large'),fd=fs.openSync(huge,'w');fs.ftruncateSync(fd,16*1024*1024+1);fs.closeSync(fd);assert.throws(()=>evidenceDigest(b),/byte limit/);
 fs.symlinkSync(a,path.join(temp,'alias'));assert.throws(()=>evidenceDigest(path.join(temp,'alias')),/directory/);
 const invalid=verifyTransport(process.cwd(),a,{} as TransportAnchor);assert.equal(invalid.status,'UNVERIFIED');assert(invalid.problems.some(p=>p.includes('external anchor')));
 console.log('PASS transport byte changes, stable enumeration, size limits, file/directory symlinks and missing anchor rejection');
} finally {fs.rmSync(temp,{recursive:true,force:true})}
