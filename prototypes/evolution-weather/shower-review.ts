const play=document.querySelector<HTMLButtonElement>('#play');
if(!play)throw Error('Missing review playback control');
play.onclick=async()=>{const videos=[...document.querySelectorAll<HTMLVideoElement>('video')];videos.forEach(v=>{v.pause();v.currentTime=0;v.playbackRate=1});const result=await Promise.allSettled(videos.map(v=>v.play()));play.textContent=result.every(r=>r.status==='fulfilled')?'两段正在1×播放':'请分别点击播放器播放'};
export {};
