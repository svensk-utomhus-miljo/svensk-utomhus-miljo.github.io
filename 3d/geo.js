globalThis.xFetch = function xFetch (url, opts, settings) {
  const q = new URLSearchParams({
    cors: JSON.stringify({
      ...settings,
      url,
    })
  })

  return fetch('https://adv-cors.deno.dev/?' + q, opts)
}

// const info = await xFetch('https://httpbin.org/get')
// const myIp = info.origin.split(',', 1)[0]
// const myLocation = await xFetch(`https://ipapi.co/${myIp}/json/`)

// const info = await xFetch('https://ipapi.co/json')

let currentPosition = {
  timestamp: Date.now(),
  coords: {
    accuracy: 13.157,
    latitude: 0,
    longitude: 0,
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


// Lägg till en "Find My Location"-knapp
const locationButton = document.createElement('button')
locationButton.textContent = 'Find My Location'
locationButton.style.cssText = `
  background: white;
  border: 2px solid #4285F4;
  border-radius: 5px;
  padding: 8px 12px;
  color: #4285F4;
  cursor: pointer;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 5;
`
// map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationButton)

const you = document.createElement('span')
you.textContent = '🚗'
you.style.fontSize = '1.4rem'

const userMarker = new google.maps.marker.AdvancedMarkerElement({
  position: myLatLng(),
  content: you,
  map,
})

function onUpdate (evt) {
  // update currentPosition
  currentPosition = evt
  userMarker.position = myLatLng()
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