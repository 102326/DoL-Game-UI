import {createLabServer} from './server.mts';
const server=await createLabServer();
await server.listen();
const address=server.httpServer!.address();
if(address && typeof address==='object')console.log('http://127.0.0.1:'+address.port+'/prototypes/host5/panel-budget/');
