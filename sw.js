const CACHE='reichas-v102-visual-suara';
/* Hanya aset yang benar-benar dipakai pada tampilan pertama. og-image.jpg
   (156 KB) dan ikon 512 px dibuang dari precache: keduanya tidak pernah
   ditampilkan ke pembaca (hanya untuk pratinjau WhatsApp dan ikon PWA),
   dan tetap dilayani lewat cache jalan-jalan di bawah bila diminta. */
const CORE=['/','/index.html','/manifest.webmanifest','/favicon.ico','/favicon.png','/icon-192.png','/logo.png','/mascot.png','/hero-m.webp','/paper.webp'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}).catch(function(){}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return k!==CACHE?caches.delete(k):null}))}));self.clients.claim()});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==location.origin||url.pathname.indexOf('/api/')===0)return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)}).catch(function(){});return r}).catch(function(){return caches.match(req).then(function(r){return r||caches.match('/')}).then(function(r){return r||caches.match('/index.html')})}));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){return r||fetch(req).then(function(res){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(req,cp)}).catch(function(){});return res}).catch(function(){return r})}));
});
