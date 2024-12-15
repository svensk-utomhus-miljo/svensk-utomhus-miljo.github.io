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