import assert from 'node:assert/strict';
import {readFile,realpath} from 'node:fs/promises';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {chromium} from 'playwright';
import {describeZip,importZip,checkLoaded} from './real-loader.mts';
import {checkRealWorkspace} from './real-workspace.mts';
import {checkRealSidebar} from './sidebar/real-loader.mts';

const approved = new Map([
  ['StoneFreeHost','6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8'],
  ['StoneFreeWorkspace','dd8138dff86da97ee4034c16969a1cf48d14a817e791365d3a022e24b1fc8e1f'],
  ['Host5Atmosphere','86b91eb34fa7702bebb037cfdbb4025b8144e91ae10254cd0fe89362588c320a'],
  ['Host5Observatory','6c0e23f5c181daef4ca1a9159a9d102e441b497233fd7f13634b34c7e94c8eb5'],
  ['StoneFreeAlternateWorkspace','ceb16bcad6a2b37a9c0076057ec4e869ba45b125cf4b64774dcf06194db54890'],
  ['maplebirch','d926f6188c4abb950d1f5f4657a1b142613dc5613a47004876f8f26793b99f76'],
  ['cheat extended','980ba672661b0171923343dd03a242670fd3553208438355b5270e101ab8e134']
]);
const [record,action,...args]=process.argv.slice(2);
assert.ok(record && action,'Expected an owned host.json and action');
const root=await realpath(resolve('tests/artifacts/host5-real-loader'));
async function ownedPath(path:string) {
  const resolved=await realpath(path);
  const rel=relative(root,resolved);
  assert.ok(rel && !rel.startsWith('..'+sep) && !rel.includes(':') && rel!=='..','Expected a dedicated UI 5.0 test resource');
  return resolved;
}
const h=JSON.parse(await readFile(await ownedPath(record),'utf8'));
assert.equal(h.format,'paisley-owned-chrome');
const profile=await ownedPath(h.profilePath);
assert.equal(await ownedPath(h.target.profilePath),profile);
const manifest=JSON.parse(await readFile(join(dirname(dirname(profile)),'resources.json'),'utf8'));
assert.equal(manifest.resourceDigest,h.resourceDigest);
assert.deepEqual(manifest.inventory,[{urlPath:'/index.html',sha256:'9ecc02d91e481054bed564a4fe1975dd5c2e38edc051e9fac350ae5bebe282a5',bytes:64576232}]);
assert.equal(h.target.document.url,'http://127.0.0.1:19753/index.html');
const endpoint=new URL(h.target.endpoint);
assert.equal(endpoint.hostname,'127.0.0.1');
const version=await (await fetch(new URL('/json/version',endpoint))).json();
assert.equal(new URL(version.webSocketDebuggerUrl).pathname,'/devtools/browser/'+h.target.browserId);
const browser=await chromium.connectOverCDP(endpoint.origin);
try {
  const pages=browser.contexts().flatMap(c=>c.pages()).filter(p=>p.url()===h.target.document.url);
  assert.equal(pages.length,1);
  const page=pages[0]!;
  const cdp=await page.context().newCDPSession(page);
  try {
    assert.equal((await cdp.send('Target.getTargetInfo')).targetInfo.targetId,h.target.targetId);
    const {frameTree}=await cdp.send('Page.getFrameTree');
    assert.equal(frameTree.frame.id,h.target.document.frameId);
    assert.equal(frameTree.frame.loaderId,h.target.document.loaderId,'Use pc-bind after a reload');
    const identity=await cdp.send('Runtime.evaluate',{expression:'location.href',uniqueContextId:h.target.document.uniqueContextId,returnByValue:true});
    assert.equal(identity.result.value,h.target.document.url);
  } finally {await cdp.detach()}
  page.setDefaultTimeout(7000);
  switch(action) {
    case 'import':
    case 'verify': {
      assert.ok(args.length);
      for (const path of args) {
        const sha=approved.get(describeZip(path).name);
        assert.ok(sha,'Unreviewed package');
        if(action==='import')console.log(await importZip(page,path,sha));
        else {
          const {createHash}=await import('node:crypto');
          assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),sha);
        }
      }
      if(action==='verify') console.log(await checkLoaded(page,args));
      break;
    }
    case 'remove': {
      const [name]=args;
      assert.ok(name && args.length===1 && ['Host5Observatory','StoneFreeWorkspace','cheat extended'].includes(name));
      console.log(await page.evaluate(async name=>{
        type Controller={listModIndexDB():Promise<string[]>;removeModIndexDB(n:string):Promise<unknown>};
        const u=(window as Window & {modUtils?:{getModLoadController():Controller}}).modUtils;
        if (!u?.getModLoadController) throw new Error('Loader controller unavailable');
        const ctl=u.getModLoadController(), before=await ctl.listModIndexDB();
        if(!before.includes(name))throw new Error('Target absent');
        await ctl.removeModIndexDB(name);
        const after=await ctl.listModIndexDB();
        if(JSON.stringify(after)!==JSON.stringify(before.filter(n=>n!==name)))throw new Error('Unexpected installed list');
        return after;
      },name));break;
    }
    case 'workspace': {
      const [mode]=args;
      assert.ok(mode && ['both','direct','alternate'].includes(mode));
      console.log(await checkRealWorkspace(page,mode!=='direct',mode==='alternate'?'侧边工作台':'信息工作台'));break;
    }
    case 'sidebar': {
      assert.ok(args.length===2 || args.length===0);
      const links: [] | [string,string] = args.length ? [args[0]!,args[1]!] : [];
      const result = await checkRealSidebar(page,links);
      if (!links.length) assert.ok(result.ceStatebox,'Expected the original CE statebox button in the current passage');
      console.log(result);
      break;
    }
    case 'reload':
      page.once('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());
      await page.reload({waitUntil:'commit'});break;
    case 'stop': {
      const session=await browser.newBrowserCDPSession();
      await session.send('Browser.close');break;
    }
    default: throw new Error('Expected import, verify, remove, workspace, sidebar, reload or stop');
  }
} finally {await browser.close()}
