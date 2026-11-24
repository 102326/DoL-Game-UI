import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import type {Page} from 'playwright';

export function readPackage(path: string, expectedName: string) {
 const bytes = readFileSync(path);
 const data: {name:string; version:string; scripts:string[]; styles:string[]} = JSON.parse(
  execFileSync(process.platform==='win32'?'python':'python3', ['-c', `
import io, json, sys, zipfile
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as z:
    assert z.testzip() is None
    boot = json.loads(z.read('boot.json'))
    def members(key):
        return [z.read(p).decode('utf-8-sig') for p in boot[key]]
    print(json.dumps(dict(name=boot['name'], version=boot['version'],
        scripts=members('scriptFileList'), styles=members('styleFileList'))))
`], {input:bytes, encoding:'utf8', maxBuffer:8*1024*1024}));
 assert.equal(data.name, expectedName);
 assert.ok(data.scripts.length);
 return {...data, sha:createHash('sha256').update(bytes).digest('hex')};
}

export async function loadPackage(page: Page, pkg: ReturnType<typeof readPackage>) {
 for (const content of pkg.styles) await page.addStyleTag({content});
 for (const content of pkg.scripts) await page.addScriptTag({content});
}
