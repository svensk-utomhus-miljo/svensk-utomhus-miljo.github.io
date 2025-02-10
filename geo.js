import { savePosition } from './karta/history.js'
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

/** @type {} */
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

/** @type {PositionOptions} */
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

const accuracyCircle = new google.maps.Circle({
  map,
  radius: 0, // Radie i meter
  fillColor: '#66aaff',
  fillOpacity: 0.2,
  strokeColor: '#66aaff',
  strokeOpacity: 0.4,
  strokeWeight: 1
})

const userMarker = new google.maps.marker.AdvancedMarkerElement({
  position: myLatLng(),
  content: you,
  map,
})


/** @type {PositionCallback} */
function onUpdate (position) {
  // update currentPosition
  currentPosition = position

  // Uppdatera cirkelns position och radie
  accuracyCircle.setCenter(myLatLng())
  accuracyCircle.setRadius(position.coords.accuracy)
  savePosition(position)
  userMarker.position = myLatLng()
}

// window.addEventListener('click', () => {
//   navigator.geolocation.watchPosition(onUpdate, console.error, options)
// }, { once: true })

function myLatLng() {
  return {
    lat: currentPosition.coords.latitude,
    lng: currentPosition.coords.longitude
  }
}

globalThis.myLatLng = myLatLng


/**
 * Emulates navigator.geolocation.watchPosition using Google Maps DirectionsResult.
 * @param {google.maps.DirectionsResult} directionsResult
 * @param {function(Position):void} onUpdate Callback that receives position updates
 */
function emulateWatchPosition(directionsResult, onUpdate) {
  const steps = directionsResult.routes[0].legs.flatMap(leg => leg.steps)
  let currentStepIndex = 0
  let startTime = performance.now()
  let stepStartTime = startTime
  let step = steps[currentStepIndex]

  function updatePosition() {
    const now = performance.now()
    const elapsedTime = (now - stepStartTime) / 1000 // Convert to seconds
    const stepDuration = step.duration.value // In seconds

    if (elapsedTime >= stepDuration) {
      // Move to the next step
      currentStepIndex++
      if (currentStepIndex >= steps.length) return // Route completed
      step = steps[currentStepIndex]
      stepStartTime = now
    }

    // Interpolate position between two points
    const path = step.path
    const progress = elapsedTime / stepDuration
    const index = Math.floor(progress * (path.length - 1))
    const nextIndex = Math.min(index + 1, path.length - 1)

    const lat1 = path[index].lat(), lng1 = path[index].lng()
    const lat2 = path[nextIndex].lat(), lng2 = path[nextIndex].lng()
    const lat = lat1 + (lat2 - lat1) * (progress % (1 / (path.length - 1)))
    const lng = lng1 + (lng2 - lng1) * (progress % (1 / (path.length - 1)))

    const position = {
      coords: { latitude: lat, longitude: lng },
      timestamp: Date.now()
    }

    onUpdate(position)
    requestAnimationFrame(updatePosition)
  }

  requestAnimationFrame(updatePosition)
}

/**
 * Avbryter simuleringen av watchPosition
 *
 * @param {object} simulation - Det id som returnerades av simulateWatchPosition
 */
const cancelSimulation = simulation => {
  if (simulation) simulation.cancelled = true
}

const simulateWatchPosition = emulateWatchPosition

export {
  currentPosition,
  simulateWatchPosition,
  cancelSimulation,
  onUpdate,
  myLatLng,
}
