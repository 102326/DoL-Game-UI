import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSettingsPreviewServer} from './preview-evolution-settings.mjs';

// Only this research server appends the candidate. Production/default preview
// and the previously accepted settings stylesheet remain unchanged.
export function createAcrylicPreviewServer(port=5197,candidate=true,plugins=[]){
 const css=path.resolve('prototypes/settings-acrylic-v1/readability.css');
 return createSettingsPreviewServer(port,[...plugins,...(candidate?[{
  name:'settings-acrylic-readability-study',enforce:'pre',
  load(id){
   if(id.split('?')[0].replaceAll('\\','/').endsWith('/src/theme/settings-workspace.css')){
    this.addWatchFile(css);
    return fs.readFileSync('src/theme/settings-workspace.css','utf8')+'\n'+fs.readFileSync(css,'utf8');
   }
  }
 }]:[])]);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await createAcrylicPreviewServer();
 console.log('Readability candidate: http://127.0.0.1:'+server.httpServer.address().port+'/?weather=snow');
}
