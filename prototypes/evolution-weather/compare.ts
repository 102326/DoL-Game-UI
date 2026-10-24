const play=document.querySelector<HTMLButtonElement>('#play');
if(!play)throw Error('Missing review playback control');
const status=document.querySelector('#status');
if(!status)throw Error('Missing review playback status');
play.onclick=async()=>{const videos=[...document.querySelectorAll<HTMLVideoElement>('video')];for(const v of videos){v.pause();v.currentTime=0;v.playbackRate=1}const results=await Promise.allSettled(videos.map(v=>v.play()));status.textContent=results.every(r=>r.status==='fulfilled')?'三段原速播放中':'请分别点击播放器开始播放'};
export {};
