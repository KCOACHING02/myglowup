// MyGlow : cache léger pour que l'app s'ouvre même avec un réseau faible, et rappels (notifications). L'API n'est jamais mise en cache.
const C = "myglow-v2";
const API = /\.github\.io$/.test(location.hostname) ? "https://myglow-en3.pages.dev/api" : "/api";
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(["./", "manifest.webmanifest", "icons/icon-192.png"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/api/")) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./"))));
});
// Rappel reçu : on va chercher le texte du message auprès de MyGlow, puis on l'affiche
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let m = { title: "MyGlow", body: "Un petit moment pour toi ✨", url: "#client" };
    try {
      const s = await self.registration.pushManager.getSubscription();
      const r = await fetch(API + "/push/msg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ep: s ? s.endpoint : "" }) });
      if (r.ok) m = Object.assign(m, await r.json());
    } catch (err) {}
    await self.registration.showNotification(m.title, { body: m.body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: m.url || "#client" }, tag: "myglow" });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "#client", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => { for (const c of L) { if ("focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); } } return self.clients.openWindow(url); }));
});
