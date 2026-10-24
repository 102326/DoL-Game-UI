import fs from 'node:fs';

export const minimumNode=fs.readFileSync(new URL('../.node-version',import.meta.url),'utf8').trim();
function parts(version:string):[number,number,number]|undefined{
  if(!/^\d+\.\d+\.\d+$/.test(version))return;
  const [major,minor,patch]=version.split('.').map(Number);
  if(major===undefined||minor===undefined||patch===undefined||![major,minor,patch].every(Number.isSafeInteger))return;
  return [major,minor,patch];
}
const baseline=parts(minimumNode);
if(!baseline||baseline[0]!==26)throw Error('Invalid Node 26 baseline');
const [,minimumMinor,minimumPatch]=baseline;
export function supportsNode(version:string):boolean{
  const value=parts(version);
  return !!value&&value[0]===26&&(value[1]>minimumMinor||(value[1]===minimumMinor&&value[2]>=minimumPatch));
}
if(!supportsNode(process.versions.node))throw Error(`Node.js 26 Only: requires >=${minimumNode} <27, received ${process.versions.node}`);
