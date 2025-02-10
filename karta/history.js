// Initierar IndexedDB och skapar ett object store för positioner.
const q = Promise.withResolvers()
const request = indexedDB.open('timelineDB', 1)

request.onupgradeneeded = () => {
  const db = request.result

  // Här sparas enbart Float32Array, så vi behöver inget keyPath eller extra indexering
  if (db.objectStoreNames.contains('positions')) return
  db.createObjectStore('positions', {
    autoIncrement: true
  })
}

request.onsuccess = q.resolve
request.onerror = q.reject

await q.promise

// Keep track of the last saved position
let lastSavedPosition = null

// Spara en referens till databasen
const db = request.result

// Komprimeringslogik med Float32Array och DataView
const floatBuffer = new Float32Array(8)

/**
 * Konverterar ett GeolocationPosition-objekt till en binär representation (Uint8Array)
 * @param {GeolocationPosition} position
 */
const toBinary = position => {
  floatBuffer[0] = Math.floor(position.timestamp / 1000)
  floatBuffer[1] = position.coords.accuracy ?? -1
  floatBuffer[2] = position.coords.altitude ?? -1
  floatBuffer[3] = position.coords.altitudeAccuracy ?? -1
  floatBuffer[4] = position.coords.heading ?? -1
  floatBuffer[5] = position.coords.latitude
  floatBuffer[6] = position.coords.longitude
  floatBuffer[7] = position.coords.speed ?? -1
}

/**
 * Tar en binär representation och återställer ett GeolocationPosition-objekt
 * @param {Float32Array} binBuffer
 * @returns {GeolocationPosition}
 */
const fromBinary = binBuffer => {
  floatBuffer.set(binBuffer)

  const location = {
    timestamp: floatBuffer[0] * 1000,
    coords: {
      accuracy: floatBuffer[1],
      altitude: floatBuffer[2],
      altitudeAccuracy: floatBuffer[3],
      heading: floatBuffer[4],
      latitude: floatBuffer[5],
      longitude: floatBuffer[6],
      speed: floatBuffer[7]
    }
  }

  for (const key in location.coords) {
    if (location.coords[key] === -1) location.coords[key] = null
  }

  // @ts-ignore
  return location
}

/**
 * Geo fencing: Returnerar true om två positioner ligger inom samma område (cirkel med radie 50 meter)
 * @param {GeolocationPosition} locationA
 * @param {GeolocationPosition} locationB
 * @param {number} radius
 */
const isApproximatelyWithinBox = (locationA, locationB, radius = 50) => {
  const { latitude: x1, longitude: y1 } = locationA.coords
  const { latitude: x2, longitude: y2 } = locationB.coords
  const R = 63710

  return (
    Math.acos(Math.sin(x1) * Math.sin(x2) + Math.cos(x1) * Math.cos(x2) * Math.cos(y2 - y1)) *
      R <
    radius
  )
}

/**
 * Sparar en position i IndexedDB som en enbart binär Uint8Array
 * @param {GeolocationPosition} position
 */
const save = async (position) => {
  const q = Promise.withResolvers()
  toBinary(position)

  const request = db
    .transaction('positions', 'readwrite')
    .objectStore('positions')
    .add(floatBuffer)

  request.onsuccess = q.resolve
  request.onerror = q.reject

  await q.promise
}

/** @param {GeolocationPosition} position */
const savePosition = async position => {
  if (lastSavedPosition && isApproximatelyWithinBox(lastSavedPosition, position)) return
  save(position)
  lastSavedPosition = position
}

const getHistory = async () => {
  const q = Promise.withResolvers()
  const request = db
    .transaction('positions', 'readonly')
    .objectStore('positions')
    .getAll()

  request.onsuccess = q.resolve
  request.onerror = q.reject

  await q.promise

  return request.result.map(fromBinary)
}

export {
  savePosition,
  getHistory
}
