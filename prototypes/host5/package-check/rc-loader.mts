/**
 * node prototypes/host5/package-check/rc-loader.mts <game.html> <stable-host.zip> <stable-ui.zip> <candidate-dir> <hashes.json>
 * hashes.json: {"game":"sha256", "stableHost":"sha256", "stableUI":"sha256", "candidates":{"filename.zip":"sha256", ...}}
 * Uses only a new temporary Chrome profile and local HTTP server. Requires authorized isolated testing.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, mkdtempSync, readdirSync, rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium, type BrowserContext, type Page} from 'playwright';
import {describeZip, importZip} from '../real-loader.mts';

const [gameArg, hostArg, uiArg, candidateArg, hashesArg, ...extra] = process.argv.slice(2);
assert.ok(gameArg && hostArg && uiArg && candidateArg && hashesArg && !extra.length,
  'Usage: node rc-loader.mts <game.html> <stable-host.zip> <stable-ui.zip> <candidate-dir> <hashes.json>');
const hashes = JSON.parse(readFileSync(hashesArg, 'utf8')) as {game:string;stableHost:string;stableUI:string;candidates:Record<string,string>};
const digest = (bytes:Buffer) => createHash('sha256').update(bytes).digest('hex');
function checked(path:string, expected:string) {
  assert.match(expected ?? '', /^[0-9a-f]{64}$/, `Expected lowercase SHA-256 for ${path}`);
  assert.equal(digest(readFileSync(path)), expected, `SHA-256 mismatch: ${path}`);
  return resolve(path);
}
assert.equal(hashes.game, '9ecc02d91e481054bed564a4fe1975dd5c2e38edc051e9fac350ae5bebe282a5', 'Expected fixed 0.5.12.13 game input');
assert.equal(hashes.stableHost, '6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8', 'Expected v4.5.2 Host');
assert.equal(hashes.stableUI, 'bfde485d3b37aaf558aa72660c41f4dc17ee7ba155663ccc4f5b95c64aed6795', 'Expected v4.5.2 UI');
const html = readFileSync(checked(gameArg, hashes.game));
const stable = [checked(hostArg,hashes.stableHost),checked(uiArg,hashes.stableUI)];
const names = readdirSync(candidateArg).filter(n=>n.endsWith('.zip')).sort();
assert.equal(names.length,8,'Candidate directory must contain exactly eight ZIPs');
assert.deepEqual(Object.keys(hashes.candidates ?? {}).sort(), names, 'Candidate hash list must match the eight filenames');
const candidate = names.map(n=>checked(join(candidateArg,n),hashes.candidates[n]!));
const packages = candidate.map(path=>({path,...describeZip(path)}));
const expectedVersions:Record<string,string> = {StoneFreeHost:'1.0.0-rc.1',DoLGameUI:'5.0.0',CheatExtendedSoftWet:'1.0.1',DolOptimizationSoftWet:'1.0.4',LyraMouthCompat051213:'1.0.0',MapleBirchSoftWet:'1.0.2',ModHubSoftWet:'1.0.5',ReOverfitsSoftWet:'1.0.2'};
assert.deepEqual(packages.map(p=>p.name).sort(),Object.keys(expectedVersions).sort(),'Candidate package identities differ');
for(const p of packages) assert.equal(p.version,expectedVersions[p.name],`Unexpected version: ${p.name}`);
assert.deepEqual(stable.map(p=>{const b=describeZip(p);return [b.name,b.version]}),[['StoneFreeHost','0.1.5-experimental'],['DoLGameUI','4.5.2']]);
const approved = new Map([[stable[0]!,hashes.stableHost],[stable[1]!,hashes.stableUI],...names.map((n,i)=>[candidate[i]!,hashes.candidates[n]!] as [string,string])]);
const core = ['StoneFreeHost','DoLGameUI'].map(name=>packages.find(p=>p.name===name)!.path);
const optional = packages.filter(p=>!core.includes(p.path)).map(p=>p.path);
const scratch = mkdtempSync(join(tmpdir(),'softwet-rc-loader-'));
const server = createServer((request,response)=>{const ok=request.url==='/index.html';response.writeHead(ok?200:404,{'content-type':'text/html; charset=utf-8'});response.end(ok?html:'')});
let context:BrowserContext|undefined, page:Page;
let loaderMessages:string[]=[];
async function start(profile:string,url:string) {
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:1360,height:900}});
  page=context.pages()[0]!; page.setDefaultTimeout(12000); loaderMessages=[];
  page.on('console',message=>{const text=message.text();if(/DependenceChecker.*(StoneFreeHost|DoLGameUI)/.test(text) && loaderMessages.length<30)loaderMessages.push(text.slice(0,500))});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof (window as any).modLoaderGui?.loadAndAddModFile==='function' && !!(window as any).modUtils?.getModListNameNoAlias,null,{timeout:60000});
}
async function install(paths:string[]) {
  for(const path of paths) console.log('import',JSON.stringify(await importZip(page,path,approved.get(path)!)));
}
async function verify(paths:string[]) {
  const expected=paths.map(describeZip);
  const rows=await page.evaluate(async pkgs=>{
    const u=(window as any).modUtils, order:string[]=u.getModListNameNoAlias();
    const out=[];
    for(const pkg of pkgs){
      const index=order.indexOf(pkg.name), zip=u.getModZip(pkg.name)?.getZipFile(), boot=u.getMod(pkg.name)?.bootJson;
      if(index<0 || index!==order.lastIndexOf(pkg.name) || !zip || boot.version!==pkg.version || JSON.stringify(boot.dependenceInfo??[])!==JSON.stringify(pkg.dependencies)) throw Error(`Missing, duplicate or metadata mismatch: ${pkg.name}`);
      for(const [name,expectedHash] of Object.entries(pkg.members)){
        const file=zip.file(name);if(!file) throw Error(`Missing member: ${pkg.name}/${name}`);
        const actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.async('uint8array')))].map(n=>n.toString(16).padStart(2,'0')).join('');
        if(actual!==expectedHash) throw Error(`Member digest mismatch: ${pkg.name}/${name}`);
      }
      out.push({name:pkg.name,version:pkg.version,index,members:Object.keys(pkg.members).length,dependencies:pkg.dependencies.map(d=>({name:d.modName,requirement:d.version,inModList:order.includes(d.modName)}))});
    }
    return out;
  },expected);
  const host=rows.find(r=>r.name==='StoneFreeHost'), ui=rows.find(r=>r.name==='DoLGameUI');
  assert.ok(host && ui && host.index<ui.index,'Actual Loader order must put Host before UI');
  console.log('loaded-and-member-verified',JSON.stringify(rows));
  console.log('Dependency inModList reports only the Loader mod list, not GameVersion or Loader pseudo-dependency satisfaction; active behavior is not verified.');
}
async function dependencyCheck(stage:string, expected:boolean) {
  const result=await page.evaluate(()=>{
    const w=window as any, u=w.modUtils, checker=w.modSC2DataManager.getDependenceChecker();
    const host=u.getMod('StoneFreeHost').bootJson.version, boot=u.getMod('DoLGameUI').bootJson;
    const requirement=boot.dependenceInfo.find((d:{modName:string})=>d.modName==='StoneFreeHost')?.version;
    if(!requirement)throw Error('UI Host dependency declaration missing');
    const api=checker.getInfiniteSemVerApi();
    return {host,ui:boot.version,requirement,matches:api.satisfies(api.parseVersion(host).version,api.parseRange(requirement)),checkAll:checker.check(),uiApiAvailable:!!w.DoLGameUI};
  });
  assert.equal(result.matches,expected,`${stage}: actual Loader matcher result`);
  console.log('dependency-check',JSON.stringify({stage,...result,startupMessages:loaderMessages}));
  return result;
}
async function adapterDiagnostics() {
  const status=await page.evaluate(()=>Object.fromEntries(['CheatExtendedSoftWet','DolOptimizationSoftWet','LyraMouthCompat051213','MapleBirchSoftWet','ModHubSoftWet','ReOverfitsSoftWet'].map(name=>{
    const api=(window as any)[name];
    try {const d=api?.getDiagnostics?.();const project=(v:any)=>({status:v?.status??null,reason:v?.reason??null,target:v?.target??null,targetVersion:v?.targetVersion??null,match:v?.match??null});return [name,Array.isArray(d)?d.map(project):d?project(d):'diagnostics unavailable'];}
    catch(e){return [name,`diagnostics failed: ${String(e)}`]}
  })));
  console.log('adapter-diagnostics',JSON.stringify(status));
}
async function ready() {
  await page.waitForFunction(()=>(window as any).SugarCube?.State?.passage==='Start',null,{timeout:60000});
  const confirm=page.locator('#ui-dialog:visible #checkbox--verify');
  if(await confirm.isVisible()){await confirm.check();await page.locator('#ui-dialog:visible').getByRole('button',{name:'Enter',exact:true}).click();await confirm.waitFor({state:'hidden'});}
  await page.locator('#dol-midnight-sidebar-button').waitFor({state:'attached',timeout:45000});
}
async function snapshot() {
  return page.evaluate(()=>({layout:localStorage.getItem('DoLGameUI.settingsLayout.v1'),position:JSON.parse(localStorage.getItem('SoftWet.MotionHub.freePosition.v1')||'null')}));
}
async function saved() {
  await page.locator('#dol-midnight-sidebar-button').click(); const panel=page.locator('#dol-midnight-controls');
  await panel.getByRole('button',{name:'\u5de6\u53f3',exact:true}).click(); await panel.getByRole('button',{name:'\u5173\u95ed',exact:true}).click();
  const prior=await snapshot();const ball=page.locator('button[aria-label^="Kraft"]');await ball.waitFor({state:'visible'});
  const box=await ball.boundingBox();assert.ok(box,'Floating button has no geometry');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width/2-180,box.y+box.height/2+100,{steps:8});await page.mouse.up();
  const value=await snapshot();assert.equal(value.layout,'vertical');assert.ok(value.position && JSON.stringify(value.position)!==JSON.stringify(prior.position),'Floating drag did not persist a changed position');return value;
}
async function assertSaved(before:Awaited<ReturnType<typeof snapshot>>, stage:string) {
  const now=await snapshot();assert.equal(now.layout,before.layout,`${stage}: layout changed`);assert.equal(now.position.x,before.position.x,`${stage}: x changed`);assert.equal(now.position.y,before.position.y,`${stage}: y changed`);console.log(stage,JSON.stringify(now));
}
try {
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  const address=server.address();assert.ok(address && typeof address!=='string');const url=`http://127.0.0.1:${address.port}/index.html`;
  const upgrade=join(scratch,'upgrade');await start(upgrade,url);await install(stable);await context!.close();await start(upgrade,url);await verify(stable);await ready();const before=await saved();
  await install([core[1]!]);await context!.close();await start(upgrade,url);await verify([stable[0]!,core[1]!]);await dependencyCheck('old-host-new-ui',false);
  await install([core[0]!]);await context!.close();await start(upgrade,url);await verify(core);await dependencyCheck('new-host-new-ui',true);await ready();await assertSaved(before,'upgrade');
  await install(stable);await context!.close();await start(upgrade,url);await verify(stable);await ready();await assertSaved(before,'rollback');
  await install(core);await install(optional);await context!.close();await start(upgrade,url);await verify([...core,...optional]);await ready();await assertSaved(before,'upgrade-with-optionals');await adapterDiagnostics();
  await context!.close();const fresh=join(scratch,'fresh');await start(fresh,url);await install([...core,...optional]);await context!.close();await start(fresh,url);await verify([...core,...optional]);await ready();await adapterDiagnostics();
  console.log('PASS: fresh install, upgrade, rollback, settings and position. Optional targets were not exercised.');
} finally {
  await context?.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));rmSync(scratch,{recursive:true,force:true});
}
