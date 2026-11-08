import { readFileSync } from 'node:fs';
import path from 'node:path';
const symbol = readFileSync(path.join(process.cwd(), 'public/brand/symbol.webp')).toString('base64');
export const preloaderHead = `<style>
#site-preloader{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#f6f7f8;color:#1c2b33;font-family:Arial,sans-serif}
:root[data-theme=dark] #site-preloader{background:#111f27;color:#f2f5f6}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) #site-preloader{background:#111f27;color:#f2f5f6}}
.boot-brand{text-align:center}.boot-symbol{position:relative;display:block;width:100px;height:100px;margin:0 auto 20px;background:currentColor;mask:url(data:image/webp;base64,${symbol}) center/contain no-repeat}
.boot-symbol:after{content:'';position:absolute;inset:0;background:#c8412c;transform:translateX(-110%);animation:boot-sweep 1.3s ease-in-out infinite}
.boot-name{font-size:23px;font-weight:700;letter-spacing:-.8px}.boot-name span{color:#c8412c}.boot-caption{font-size:12px;letter-spacing:.04em;margin:12px 0 0;opacity:.7}
@keyframes boot-sweep{to{transform:translateX(110%)}}
@media(prefers-reduced-motion:reduce){.boot-symbol:after{animation:none;transform:none;opacity:.25}}
</style><script>
(()=>{
 let done=false,box=null;
 const finish=()=>{if(done)return;done=true;clearTimeout(showTimer);clearTimeout(limit);box?.remove();document.documentElement.dataset.bootState='ready';};
 const show=()=>{if(done||!document.body)return;box=document.createElement('div');box.id='site-preloader';box.setAttribute('role','status');box.setAttribute('aria-label','Загрузка CarPort China');box.innerHTML='<div class="boot-brand"><span class="boot-symbol" aria-hidden="true"></span><div class="boot-name">CarPort <span>China</span></div><p class="boot-caption">Загружаем страницу</p></div>';document.body.append(box);document.documentElement.dataset.bootState='loading';};
 const showTimer=setTimeout(show,180);
 // Fail open on unavailable resources; this is a maximum, never a minimum hold.
 const limit=setTimeout(finish,8000);
 document.addEventListener('DOMContentLoaded',()=>{
   if(done)return;
   const images=[...document.querySelectorAll('main img')].filter(img=>{const r=img.getBoundingClientRect();return r.width>0&&r.top<innerHeight&&r.bottom>0&&!img.closest('[aria-hidden="true"]');});
   const ready=images.map(img=>new Promise(resolve=>{
     const decoded=()=>{if(img.decode)img.decode().catch(()=>{}).then(resolve);else resolve();};
     if(img.complete){decoded();return;}
     img.addEventListener('load',decoded,{once:true});img.addEventListener('error',resolve,{once:true});img.loading='eager';
   }));
   if(document.fonts)ready.push(document.fonts.ready.catch(()=>{}));
   Promise.allSettled(ready).then(finish);
 },{once:true});
 window.addEventListener('pagehide',finish,{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted)finish();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')finish();});
})();
</script>`;
