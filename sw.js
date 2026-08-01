const CACHE='reichas-v10';
const CORE=['/','/index.html','/manifest.webmanifest','/icon-180.png','/icon-192.png','/icon-512.png','/icon-maskable-512.png','/og-image.jpg'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}).catch(function(){}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return k!==CACHE?caches.delete(k):null}))}));self.clients.claim()});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==location.origin||url.pathname.indexOf('/api/')===0)return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put('/',cp)}).catch(function(){});return r}).catch(function(){return caches.match('/').then(function(r){return r||caches.match('/index.html')})}));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){return r||fetch(req).then(function(res){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(req,cp)}).catch(function(){});return res}).catch(function(){return r})}));
});
