import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {accessSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,type Browser} from 'playwright';

export async function withVisibleBrowser(run:(browser:Browser)=>Promise<void>){
 const exe=process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':join(process.env.ProgramFiles!, 'Google/Chrome/Application/chrome.exe'));
 accessSync(exe);
 const temp=resolve(tmpdir()),profile=mkdtempSync(join(temp,'sw41-background-'));
 // Default Playwright focus emulation keeps inactive pages visible. Connect to
 // our own headed Chrome without that override, using its ephemeral loopback port.
 const child=spawn(exe,[`--user-data-dir=${profile}`,'--remote-debugging-port=0','--no-first-run',
  '--no-default-browser-check','--disable-background-networking','--disable-features=CalculateNativeWinOcclusion','about:blank'],{stdio:'ignore'});
 const exited=once(child,'exit');
 let browser:Browser|undefined;
 try {
  let port='';
  for(let i=0;i<100&&!port;i++){
   try{port=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/)[0]??''}
   catch{await delay(50)}
  }
  assert.match(port,/^\d+$/);
  browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{noDefaults:true});
  await run(browser);
 } finally {
  if(browser){
   const session=await browser.newBrowserCDPSession();
   await session.send('Browser.close').catch(()=>{});
  }else child.kill();
  await exited;
  assert.ok(dirname(resolve(profile))===temp&&basename(profile).startsWith('sw41-background-'));
  rmSync(profile,{recursive:true,force:true,maxRetries:3});
 }
}
