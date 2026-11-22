class AssetManager{
 constructor(list){this.list=list;this.cache=new Map();this.failures=[];this.ready=false}
 preload(){return Promise.all(this.list.map(entry=>new Promise(resolve=>{if(typeof Image==='undefined'){resolve();return}const img=new Image();img.onload=()=>{this.cache.set(entry.id,img);resolve()};img.onerror=()=>{this.failures.push(entry.path);resolve()};img.src=entry.path}))).then(()=>this.ready=true)}
 draw(ctx,id,x,y,w,h,frame=0){const img=this.cache.get(id),entry=this.list.find(e=>e.id===id);if(!img||!entry){ctx.fillStyle='#c9ad72';ctx.fillRect(Math.round(x),Math.round(y),w,h);return}const fw=img.naturalWidth/entry.frames;ctx.drawImage(img,(Math.floor(frame)%entry.frames)*fw,0,fw,img.naturalHeight,Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
 html(id,cls='icon',label=''){const e=this.list.find(e=>e.id===id);return e?`<img class="${cls}" src="${e.path}" alt="${label}" draggable="false">`:''}
}
const assets=new AssetManager(ASSET_LIST);assets.preload();
