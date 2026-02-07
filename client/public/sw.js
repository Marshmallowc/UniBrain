// 这是一个基础的 Service Worker，用于满足 PWA 安装条件
self.addEventListener('install', (event) => {
  console.log('UniBrain Service Worker installed');
});

self.addEventListener('fetch', (event) => {
  // 这里可以做缓存逻辑，暂时留空
});
