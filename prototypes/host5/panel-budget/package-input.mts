import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import type {Page} from 'playwright';

export function readPackage(path: string, expectedName: string) {
 // Read and hash one ZIP snapshot in the parser; only decoded output crosses the pipe.
 const data: {sha:string; name:string; version:string; scripts:string[]; styles:string[]} = JSON.parse(
  execFileSync(process.platform==='win32'?'python':'python3', ['-c', `
import hashlib, io, json, sys, zipfile
from pathlib import Path
snapshot = Path(sys.argv[1]).read_bytes()
with zipfile.ZipFile(io.BytesIO(snapshot)) as z:
    assert z.testzip() is None
    boot = json.loads(z.read('boot.json'))
    def members(key):
        return [z.read(p).decode('utf-8-sig') for p in boot[key]]
    print(json.dumps(dict(sha=hashlib.sha256(snapshot).hexdigest(), name=boot['name'], version=boot['version'],
        scripts=members('scriptFileList'), styles=members('styleFileList'))))
`, path], {encoding:'utf8', maxBuffer:8*1024*1024}));
 assert.equal(data.name, expectedName);
 assert.ok(data.scripts.length);
 return data;
}

export async function loadPackage(page: Page, pkg: ReturnType<typeof readPackage>) {
 for (const content of pkg.styles) await page.addStyleTag({content});
 for (const content of pkg.scripts) await page.addScriptTag({content});
}
