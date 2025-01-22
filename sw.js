import { Router } from './itty-router.js'
import proxyGoogleMapsAPI from './proxy.js'

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

const sw = globalThis
const router = Router()

router
  .all('*', ctx => {
    // console.log('fetching', ctx.request.destination, ctx.request.url)
  })
  .get('https://maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true', () => {
    return Response.json({})
  })
  .get(...proxyGoogleMapsAPI)
  .post(...proxyGoogleMapsAPI)
  // .get(
  //   ctx => !ctx.request.url.includes('/kh?v=') && [
  //     'script',
  //     'worker',
  //     'style',
  //     'image',
  //     'font',
  //     'document'
  //   ].includes(ctx.request.destination),
  //   ctx => cacheFirst(ctx.request)
  // )
  .all('*', ctx => {
    if (ctx.request.destination === 'document') {
      return fetch('/index.html')
    }
    return fetch(ctx.request)
  })

/**
 * Convert anything to a response
 * @return {Response}
 */
function convertToResponse (thing) {
  if (thing instanceof Response) return thing
  if (typeof thing === undefined) {
    return new Response('Not Found.', { status: 404 })
  }
  if (Array.isArray(thing) || isPlainObject(thing)) {
    return Response.json(thing)
  }
  return new Response(thing)
}

function isPlainObject (o) {
  var ctor,prot;
  if (isObject(o) === false) return false
  ctor = o.constructor
  if (ctor === undefined) return true
  prot = ctor.prototype
  if (isObject(prot) === false) return false
  return Object.hasOwn(prot, 'isPrototypeOf')
}

// A generic error handler
function errorHandler (error, request) {
  console.error(error, request)
  return new Response(error.stack || 'Server Error', {
    status: error.status || 200
  })
}

// attach the router "handle" to the event handler
sw.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url)
  if (
    url.pathname.startsWith('/3d/') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.includes('hotword') ||
    url.hostname === 'api.hitta.se' ||
    url.hostname === 'supabase.co' ||
    url.hostname === 'adv-cors.deno.dev' ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname.endsWith('gstatic.com')
  ) {
    return
  }

  const handler = router
    .handle(evt)
    .then(convertToResponse)
    .catch(err => errorHandler(err, evt.request))

  evt.respondWith(handler)
})

// Simple helper use waitUntil and logging any errors that occur.
const t = (evt, fn) => evt.waitUntil(fn().catch(console.error))


sw.onactivate = evt => t(evt, () => sw.clients.claim())
sw.onmessage = async evt => {
  const { data, ports } = evt

  if (data === 'dc') {
    ports[0].onmessage = evt => {
      ports[0].postMessage('hello')
    }
    return
  }

  if (data !== 'claimMe') return

  t(evt, async () => {
    await sw.clients.claim()
    ports[0].postMessage('claimed')
  })
}

// sw.addEventListener('install', () => {
//   caches.open('v1').then(async cache => {
//     const localResources = [
//       '/customer-list.js',
//       '/db.js',
//       '/event.js',
//       '/geo.js',
//       '/index.html',
//       '/itty-router.js',
//       '/main.js',
//       '/map.js',
//       '/proxy.js',
//       '/reg-sw.js',
//       '/sw.js',
//     ]

//     cache.put(
//       'https://maps.googleapis.com/maps-api-v3/api/js/59/3a-beta/intl/sv_ALL/common.js',
//       new Response('console.log("hello")')
//     )
//   })
// })

/** look for request in cache, if not found, fetch and cache  */
async function cacheFirst (req) {
  const cache = await caches.open('v1')
  const cached = await cache.match(req)
  if (cached) return cached
  const res = await fetch(req)
  await cache.put(req, res.clone())
  return res
}