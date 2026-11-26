// Bake a deterministic opacity field once per weather mount. Drift only transforms the bitmap.
export function cloudTexture(){
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=224;
 const ctx=canvas.getContext('2d')!,image=ctx.createImageData(canvas.width,canvas.height);
 function noise(x:number,y:number){
  const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};
  const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j;
  const a=u*u*(3-2*u),b=v*v*(3-2*v);
  return (1-b)*((1-a)*hash(i,j)+a*hash(i+1,j))+b*((1-a)*hash(i,j+1)+a*hash(i+1,j+1));
 }
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const n=.53*noise(x/85,y/33)+.28*noise(x/35+8,y/12)+.14*noise(x/17,y/7)+.05*noise(x/6,y/3);
  const v=Math.max(0,Math.min(1,(n-.31)*2.6)),i=(y*canvas.width+x)*4;
  image.data.set([75+90*n,80+90*n,90+90*n,245*v],i);
 }
 ctx.putImageData(image,0,0);return canvas;
}
