const CACHE='food-journal-v7';
const STATIC=['manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  // Always bypass: API calls and CDN scripts
  if(e.request.url.includes('api.anthropic.com')||e.request.url.includes('cdn.jsdelivr.net')||e.request.url.includes('gist.githubusercontent.com'))return;

  // index.html: network first, fall back to cache
  if(e.request.url.endsWith('/')||e.request.url.includes('index.html')||e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res&&res.status===200){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>caches.match('index.html'))
    );
    return;
  }

  // Everything else: cache first, fall back to network
  e.respondWith(caches.match(e.request).then(cached=>{
    if(cached)return cached;
    return fetch(e.request).then(res=>{
      if(res&&res.status===200){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}
      return res;
    }).catch(()=>caches.match('index.html'));
  }));
});
