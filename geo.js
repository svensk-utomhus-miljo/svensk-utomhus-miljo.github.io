globalThis.xFetch = function xFetch (url, opts, settings) {
  const q = new URLSearchParams({
    cors: JSON.stringify({
      ...settings,
      url,
    })
  })

  return fetch('https://adv-cors.deno.dev/?' + q, opts).then(r => r.json())
}

// const info = await xFetch('https://httpbin.org/get')
// const myIp = info.origin.split(',', 1)[0]
// const myLocation = await xFetch(`https://ipapi.co/${myIp}/json/`)

const info = await xFetch('https://ipapi.co/json')


let currentPosition = {
  timestamp: Date.now(),
  coords: {
    accuracy: 13.157,
    latitude: info.latitude,
    longitude: info.longitude,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null
  },
}

const options = {
  enableHighAccuracy: true,
  // timeout: 5000,
  maximumAge: 0
}

async function getCoords (resolve, reject) {
  const permission = await navigator.permissions.query({ name: 'geolocation' })

  // is geolocation granted?
  return permission.state === "granted"
    ? navigator.geolocation.getCurrentPosition(resolve, reject, options)
    : fetch('/api/me')
      .then(r => r.json())
      .then(json => {
        currentPosition.coords.latitude = json.ip.latitude
        currentPosition.coords.longitude = json.ip.longitude
        resolve(currentPosition)
      })
}

// currentPosition = await new Promise(getCoords)

function onUpdate (evt) {
  // update currentPosition
  currentPosition = evt
  globalThis.map.userMarker.position = myLatLng()
}

window.addEventListener('click', () => {
  navigator.geolocation.watchPosition(onUpdate, console.error, options)
}, { once: true })

function myLatLng() {
  return {
    lat: currentPosition.coords.latitude,
    lng: currentPosition.coords.longitude
  }
}

export {
  currentPosition,
  myLatLng
}