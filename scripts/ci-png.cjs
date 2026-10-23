// Bounded structural PNG verification, independent of browser/native npm dependencies.
const zlib=require('node:zlib');
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc(bytes){let value=0xffffffff;for(const byte of bytes)value=table[(value^byte)&255]^(value>>>8);return(value^0xffffffff)>>>0}
function verifyPng(bytes){
 if(bytes.length<57||bytes.length>8388608||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid PNG signature/size');
 let offset=8,header,ended=false,palette=false,dataEnded=false;const data=[];
 while(offset<bytes.length){if(offset+12>bytes.length)throw Error('Truncated PNG chunk');const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8),end=offset+12+length;if(end>bytes.length||!/^[a-zA-Z]{4}$/.test(type)||crc(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))throw Error('PNG chunk length/CRC mismatch');
  const payload=bytes.subarray(offset+8,end-4);
  if(!header&&type!=='IHDR')throw Error('PNG missing first IHDR');
  if(type==='IHDR'){if(header||length!==13)throw Error('Invalid PNG IHDR');header={width:payload.readUInt32BE(0),height:payload.readUInt32BE(4),depth:payload[8],color:payload[9]};if(!header.width||!header.height||header.width*header.height>16777216||payload[10]||payload[11]||payload[12])throw Error('PNG geometry/compression/interlace limit');}
  else if(type==='PLTE'){if(palette||data.length||!length||length%3||length>768)throw Error('Invalid PNG palette');palette=true;}
  else if(type==='IDAT'){if(dataEnded)throw Error('PNG noncontiguous IDAT');data.push(payload);}
  else{if(data.length)dataEnded=true;if(type==='IEND'){if(length||end!==bytes.length)throw Error('Invalid PNG ending');ended=true;}else if(type[0]===type[0].toUpperCase())throw Error('Unknown critical PNG chunk');}
  offset=end;
 }
 if(!ended||!data.length)throw Error('PNG missing data/end');
 const channels={0:1,2:3,3:1,4:2,6:4}[header.color],allowed={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]}[header.color];if(!channels||!allowed.includes(header.depth)||(header.color===3&&!palette))throw Error('Invalid PNG color/depth');
 const row=Math.ceil(header.width*channels*header.depth/8)+1,expected=row*header.height;if(expected>67108864)throw Error('PNG decompression budget');
 const compressed=Buffer.concat(data),inflated=zlib.inflateSync(compressed,{maxOutputLength:expected+1,info:true}),decoded=inflated.buffer;if(inflated.engine.bytesWritten!==compressed.length)throw Error('PNG trailing compressed data');if(decoded.length!==expected)throw Error('PNG decoded dimensions mismatch');for(let i=0;i<decoded.length;i+=row)if(decoded[i]>4)throw Error('Invalid PNG scanline filter');
 return{width:header.width,height:header.height};
}
module.exports={verifyPng};
