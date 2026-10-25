const play=document.querySelector<HTMLButtonElement>('#play');
if(!play)throw Error('Missing review playback control');
const status=document.querySelector('#status');
if(!status)throw Error('Missing review playback status');
play.onclick=async()=>{const vs=[...document.querySelectorAll<HTMLVideoElement>('video')];for(const v of vs){v.pause();v.currentTime=0;v.playbackRate=1}const results=await Promise.allSettled(vs.map(v=>v.play()));status.textContent=results.every(r=>r.status==='fulfilled')?'播放中 · 1×':'部分视频未能播放，请使用各自控件'}
export {};
