const u = "https://maps.googleapis.com/maps/api/js/DirectionsService.Route?5m4&1m3&1m2&1d59.25339345057209&2d17.877295337295187&5m4&1m3&1m2&1d59.25630520563647&2d17.87916961210842&6e0&7b1&8b1&9sSE&12ssv&13e0&23e1&r_url=http%3A%2F%2Flocalhost%3A5173%2F&callback=_xdc_._x0job7&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&token=18468"
const url = new URL(u)
url.searchParams.set('r_url', 'http://localhost:5173/')
const final = url.toString().replaceAll('=&', '&')

const q = new URLSearchParams({
  cors: JSON.stringify({
    url: final,
    forwardRequestHeaders: false,
  })
})

const res = await fetch('https://adv-cors.deno.dev/?' + q, {
  // headers: ctx.request.headers,
})

res.text().then(t => console.log(t))