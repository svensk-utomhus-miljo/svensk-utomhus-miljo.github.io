// const u    = 'https://maps.googleapis.com/maps/api/js/DirectionsService.Route?5m4&1m3&1m2&1d59.25339345057209&2d17.877295337295187&5m4&1m3&1m2&1d59.25630520563647&2d17.87916961210842&6e0&7b1&8b1&9sSE&12ssv&13e0&23e1&r_url=https%3A%2F%2Fsvensk-utomhus-miljo.github.io%2F&callback=_xdc_._x0job7&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&token=18468'
// // const u = "https://maps.googleapis.com/maps/api/js/DirectionsService.Route?5m4&1m3&1m2&1d59.25339345057209&2d17.877295337295187&5m4&1m3&1m2&1d59.25630520563647&2d17.87916961210842&6e0&7b1&8b1&9sSE&12ssv&13e0&23e1&r_url=http%3A%2F%2Flocalhost%3A5173%2F"           + "&callback=_xdc_._x0job7&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&token=18468"
// const url = new URL(u)
// url.searchParams.set('r_url', 'http://localhost:5173/')
// const final = url.toString().replaceAll('=&', '&')

// const q = new URLSearchParams({
//   cors: JSON.stringify({
//     url: final,
//     forwardRequestHeaders: false,
//   })
// })

// const res = await fetch('https://adv-cors.deno.dev/?' + q, {
//   // headers: ctx.request.headers,
// })

// res.text().then(t => console.log(t))


const reqBody = {
  "origin": {
    "vehicleStopover": false,
    "sideOfRoad": false,
    "address": "Vikingavägen 13, Huddinge, Sverige"
  },
  "destination": {
    "vehicleStopover": false,
    "sideOfRoad": false,
    "address": "Huddinge Centrum, Kommunalvägen, Huddinge, Sverige"
  },
  // "intermediates": [
    // {
    //   "location":{
    //     "latLng":{
    //       "latitude": 37.419734,
    //       "longitude": -122.0807784
    //     }
    //   }
    // }
  // ],
  "travelMode": "drive",
  "routingPreference": "traffic_unaware",
  "polylineQuality": "high_quality",
  "computeAlternativeRoutes": false,
  "routeModifiers": {
    "avoidTolls": false,
    "avoidHighways": false,
    "avoidFerries": false,
    "avoidIndoor": false
  }
}


// const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
//   "headers": {
//     "accept": "*/*",
//     "content-type": "application/json",
//     "x-goog-api-key": "AIzaSyAOWd855Jru-vGD_bVJqc6Qr-n8VpX0XsA",
//     "x-goog-fieldmask": "*",
//     "Referer": "https://developers-dot-devsite-v2-prod.appspot.com/"
//   },
//   "body": body,
//   "method": "POST"
// });

// const data = await res.json()

// console.log(data)



const q = new URLSearchParams({
  cors: JSON.stringify({
    url: "https://routes.googleapis.com/directions/v2:computeRoutes",
    setRequestHeaders: [
      ["x-goog-api-key", "AIzaSyAOWd855Jru-vGD_bVJqc6Qr-n8VpX0XsA"],
      ["x-goog-fieldmask", "*"],
      ['referer','https://developers-dot-devsite-v2-prod.appspot.com/'],
      ['origin','https://developers-dot-devsite-v2-prod.appspot.com'],
    ],
    forwardRequestHeaders: false,
  })
})

fetch('https://adv-cors.deno.dev/?' + q, {
  method: 'POST',
  body: JSON.stringify(reqBody)
}).then(r => r.json()).then(console.log)