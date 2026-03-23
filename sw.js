const CACHE='food-journal-v8';
const STATIC=['manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(STATIC))
      .then(()=>self.skipWaiting()) // Force activate immediately
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim()) // Take control of all pages immediately
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  // Always bypass cache for these
  if(e.request.url.includes('api.anthropic.com')||
     e.request.url.includes('cdn.jsdelivr.net')||
     e.request.url.includes('gist.githubusercontent.com'))return;

  // index.html and navigation: always network first, update cache
  if(e.request.mode==='navigate'||e.request.url.endsWith('/')||e.request.url.includes('index.html')){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(res=>{
          if(res&&res.status===200){
            const clone=res.clone();
            caches.open(CACHE).then(c=>c.put(e.request,clone));
          }
          return res;
        })
        .catch(()=>caches.match('index.html'))
    );
    return;
  }

  // Static assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached)return cached;
      return fetch(e.request).then(res=>{
        if(res&&res.status===200){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>caches.match('index.html'));
    })
  );
});
