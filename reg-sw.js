const sw = await navigator.serviceWorker.register('/sw.js', {
  scope: '/',
  type: 'module'
})

setInterval(() => {
  ;(sw.installing || sw.active).postMessage('ping') // keep the service worker alive
}, 5000)

export { }