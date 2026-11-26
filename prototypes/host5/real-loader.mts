/** Helpers for a caller-owned, identity-checked page running the real distribution Loader. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {basename} from 'node:path';
import type {Page} from 'playwright';

type Package = {name: string; version: string; members: Record<string,string>; dependencies: {modName:string;version:string}[]};
type Reader = {bootJson: {name:string;version:string;dependenceInfo?:Package['dependencies']}};
type GameWindow = Window & {
  modLoaderGui?: {loadAndAddModFile(file:File):Promise<string>};
  modUtils?: {
    getModListNameNoAlias(): string[];
    getMod(name:string): Reader;
    getModZip(name:string): {getZipFile():{file(name:string):{async(type:'uint8array'):Promise<Uint8Array<ArrayBuffer>>}|null}};

  };
};

export function describeZip(path: string): Package {
  return JSON.parse(execFileSync('python',['-c',`
import sys, hashlib, zipfile, json
with zipfile.ZipFile(sys.argv[1]) as z:
    assert z.testzip() is None and len(z.namelist()) == len(set(z.namelist()))
    b=json.loads(z.read("boot.json").decode("utf-8-sig"))
    print(json.dumps(dict(name=b["name"],version=b["version"],dependencies=b.get("dependenceInfo",[]),
        members={k:hashlib.sha256(z.read(k)).hexdigest() for k in z.namelist() if not k.endswith("/")})))
`,path],{encoding:'utf8'}));
}

export async function importZip(page: Page, path: string, expectedSha256: string) {
  const bytes = await readFile(path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedSha256);
  const expected = describeZip(path);
  const installed = await page.evaluate(async ({data,filename}) => {
    const binary = atob(data);
    const file = new File([Uint8Array.from(binary, ch => ch.charCodeAt(0))],filename,{type:'application/zip'});
    const gui = (window as GameWindow).modLoaderGui;
    if (!gui?.loadAndAddModFile) throw new Error('Loader GUI import unavailable');
    return gui.loadAndAddModFile(file);
  }, {data:bytes.toString('base64'),filename:basename(path)});
  assert.equal(installed,expected.name);
  return {name:installed,version:expected.version,sha256:expectedSha256};
}

export async function checkLoaded(page: Page, paths: string[]) {
  const packages = paths.map(describeZip);
  return page.evaluate(async packages => {
    const u = (window as GameWindow).modUtils;
    if (!u?.getModListNameNoAlias) throw new Error('Loader runtime unavailable');
    const order = u.getModListNameNoAlias();
    if (order.includes('DoLGameUI')) throw new Error('Unexpected main UI');
    const rows=[];
    for(const pkg of packages){
      const position=order.indexOf(pkg.name);
      if(position<0 || order.lastIndexOf(pkg.name)!==position) throw new Error('Missing or duplicate '+pkg.name);
      const boot = u.getMod(pkg.name).bootJson;
      if(boot.version!==pkg.version || JSON.stringify(boot.dependenceInfo ?? [])!==JSON.stringify(pkg.dependencies))
        throw new Error('Metadata mismatch '+pkg.name);
      const archive = u.getModZip(pkg.name).getZipFile();
      for(const [name,expected] of Object.entries(pkg.members)){
        const member = archive.file(name);
        if(!member) throw new Error('Missing member '+pkg.name+' '+name);
        const hash=await crypto.subtle.digest('SHA-256',await member.async('uint8array'));
        const actual=Array.from(new Uint8Array(hash), n=>n.toString(16).padStart(2,'0')).join('');
        if(actual!==expected) throw new Error('Member mismatch '+pkg.name+' '+name);
      }
      for(const dep of pkg.dependencies.filter(d=>packages.some(p=>p.name===d.modName))){
        if(order.indexOf(dep.modName)<0 || order.indexOf(dep.modName)>=position) throw new Error('Dependency order '+dep.modName);
      }
      rows.push({name:pkg.name,version:boot.version,position,checkedMembers:Object.keys(pkg.members).length});
    }
    return rows;
  },packages);
}
