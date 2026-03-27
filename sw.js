const CACHE='food-journal-v9';
const STATIC=['manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(STATIC))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.url.includes('api.anthropic.com')||
     e.request.url.includes('cdn.jsdelivr.net')||
     e.request.url.includes('gist.githubusercontent.com'))return;

  if(e.request.mode==='navigate'||e.request.url.endsWith('/')