import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {candidate,verify} from './candidate.mts';
import catalog from '../../scripts/ci-catalog.cjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ui42-shadow-plans-')),out=path.resolve('tests/artifacts/ui42/ci-c1');fs.mkdirSync(out,{recursive:true});
const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,stdio:['ignore','pipe','pipe']}).toString().trim();
const inputs=['src/theme/acrylic.ts','src/ui/golden-spin/hub-motion.ts','src/theme/preferences.ts','framework/official-ui/motion.ts','package-lock.json','package.json','src/theme/settings-material.ts'];
const scenarios=[['S1','src/theme/acrylic.ts','review-candidate'],['S2','src/ui/golden-spin/hub-motion.ts','review-candidate'],['S3','src/theme/preferences.ts','full'],['S4','framework/official-ui/motion.ts','review-candidate'],['S5','rename/delete','full'],['S6','package-lock.json','full'],['S7','package.json','full'],['S8','src/theme/settings-material.ts','full']] as const;
fs.writeFileSync(path.join(out,'frozen-plan-scenarios.json'),JSON.stringify({scope:'plan-level real Git changes only; no consumer execution in these eight rows',scenarios},null,2));
const rows:unknown[]=[];
try{
 git('init','-q');git('config','core.autocrlf','false');
 for(const file of inputs){const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target)}
 git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','real-source sample baseline');const base=git('rev-parse','HEAD');
 for(const [id,file,mode]of scenarios){
  if(id==='S5'){
   const old=path.join(dir,'src/theme/acrylic.ts'),renamed=path.join(dir,'src/theme/acrylic-renamed.ts');fs.renameSync(old,renamed);git('add','-A');const r=candidate(dir,base);assert.equal(r.mode,'full');assert(r.changes.some(c=>c.status.startsWith('R')));
   git('reset','--hard','-q',base);fs.unlinkSync(old);const d=candidate(dir,base);assert.equal(d.mode,'full');assert(d.changes.some(c=>c.status==='D'));rows.push({id,status:'PLAN_PASS',variants:[r,d]});
  }else{
   const target=path.join(dir,file),text=fs.readFileSync(target,'utf8');fs.writeFileSync(target,id==='S7'?text.replace('"version": "4.1.0"','"version": "4.2.0-rc.0"'):id==='S6'?text+'\n':text+'\n// isolated plan sample\n');
   const p=candidate(dir,base);assert.equal(p.mode,mode);assert(verify(dir,base,p));
   if(mode==='full'){assert.equal(p.standard.length,catalog.catalogFor('standard').contracts.length);assert.equal(p.research.length,catalog.catalogFor('research').contracts.length)}
   else{
    for(const consumer of ['browser.evolution-owner-resources.cjs','stage.dependencies','stage.check','stage.build','stage.packages','stage.browser-install'])assert(p.standard.includes(consumer),id+' misses '+consumer);
    for(const dep of ['research.evolution-owner-resources','research.framework-build','research.source-check'])assert(p.research.includes(dep),id+' misses '+dep);
    if(id==='S1'){assert(p.standard.includes('browser.adapter-materials.cjs'));assert(p.standard.includes('browser.device-layouts.cjs'));assert(p.standalone.includes('tests/ui41-material.cjs'))}
    if(id==='S2')assert(p.standard.includes('browser.device-layouts.cjs'));
    if(id==='S4')for(const consumer of ['browser.official-game-motion.cjs','browser.evolution-navigation.cjs','browser.evolution-panels.cjs'])assert(p.standard.includes(consumer));
   }
   rows.push({id,status:'PLAN_PASS',plan:p});
  }
  git('reset','--hard','-q',base);
 }
 assert.equal(rows.length,8);fs.writeFileSync(path.join(out,'plan-scenarios.json'),JSON.stringify({scope:'eight plan scenarios; separate combined consumer execution required',rows,status:'PASS'},null,2));console.log('PASS eight frozen plan scenarios, real source paths and Git rename/delete');
}finally{assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'ui42-shadow-plans-'));fs.rmSync(dir,{recursive:true,force:true})}
