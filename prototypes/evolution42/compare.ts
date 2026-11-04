const videos=[...document.querySelectorAll('video')],button=document.getElementById('play');
if(!button)throw Error('Missing playback button');
button.onclick=()=>{for(const video of videos){video.pause();video.currentTime=0;video.playbackRate=1}void Promise.all(videos.map(video=>video.play())).catch(()=>{button.textContent='媒体未准备好，请先运行原型检查生成录像。'})};
window.addEventListener('pagehide',()=>{for(const video of videos)video.pause()},{once:true});
