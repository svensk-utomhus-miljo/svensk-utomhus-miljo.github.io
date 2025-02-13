import { on, dispatch } from './event.js'
import { currentPosition, myLatLng, simulateWatchPosition, onUpdate } from './geo.js'
import { supabase } from './db.js'
import './info-window-content.js'
import { $place, $map } from './main.js'
import { makePlaceFromMarker } from './fake.js'
import './reactive.js'
import { Poi } from './poi.js'
import './karta/rita.js'


const { UnitSystem, TravelMode, InfoWindow, LatLng, Polygon, Size, ImageMapType, StreetViewService } = google.maps
const { PinElement, AdvancedMarkerElement } = google.maps.marker

globalThis.supabase = supabase
globalThis.allMarkers = {}
globalThis.allCustomersMarkers = {}
globalThis.getAllCustomers = getAllCustomers


function getAllCustomers () {
  return Object.keys(allCustomersMarkers)
    .filter(key => key !== 'undefined')
      .map(key => allMarkers[key])
}

let zoomedIn = map.getZoom() > 16.48

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.gmpClickable = entry.isIntersecting
  })
}, {
  root: map.getDiv(),
  rootMargin: "0px",
  threshold: 1.0
})

globalThis.observer = observer

map.addListener('zoom_changed', () => {
  const zoom = map.getZoom()

  if (zoomedIn) {
    if (zoom < 16.48) {
      zoomedIn = false
      dispatch(map, 'zoomedOut')
    }
  } else {
    if (zoom > 16.48) {
      zoomedIn = true
      dispatch(map, 'zoomedIn')
    }
  }
})

// Skapa en custom Tile Overlay
const customTileLayer = new ImageMapType({
  getTileUrl (coord, zoom) {
    if (zoom < 17 || map.mapTypeId !== 'satellite') return ''
    return `https://api.hitta.se/image/v2/realestate/g/${zoom}/${coord.x}/${coord.y}?v=18032023`
  },
  tileSize: new Size(256, 256),
  opacity: 1,
  name: 'Hitta.se Estate'
})

on(map, 'zoomedIn', () => {
  Object.values(allMarkers).forEach(marker => {
    if (!(marker.data?.type === 'pin' || marker.data?.type === 'customer')) {
      if (marker.element) {
        marker.element.hidden = false
      } else {
        marker.setMap(map)
      }
    }
  })

  // Lägg till tile-lagret på kartan
  map.overlayMapTypes.insertAt(0, customTileLayer)
})

on(map, 'zoomedOut', () => {
  Object.values(allMarkers).forEach(marker => {
    if (!(marker.data?.type === 'pin' || marker.data?.type === 'customer')) {
      if (marker.element) {
        marker.element.hidden = true
      } else {
        marker.setMap(null)
      }
    }
  })

  // ta bort tile-lagret på kartan
  map.overlayMapTypes.removeAt(0)
})

// Lägg till event listeners för alla ändringar
function listenToPolygonChanges(polygon) {
  const path = polygon.getPath()

  const onChange = () => {
    polygon.data.meta.paths = path.getArray().map(latLng => latLng.toJSON())
  }

  path.addListener('set_at', onChange)
  path.addListener('insert_at', onChange)
  path.addListener('remove_at', onChange)
}

// Lägg till tile-lagret på kartan
map.overlayMapTypes.insertAt(0, customTileLayer)


supabase.from('poi').select('*')
.then(result => {
  result.data?.forEach(poi => {
    poi = Poi(poi)
    if (poi.type === 'polygon') {
      const polygon = new Polygon({
        paths: poi.meta.paths,
        strokeColor: poi.meta.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: poi.meta.color,
        fillOpacity: 0.32,
        editable: false,
        clickable: false,
        data: poi,
      })

      listenToPolygonChanges(polygon)

      allMarkers[poi.id] = polygon

      polygon.addListener('contextmenu', function (mev) {
        globalThis.polygon = this
        if (mev.vertex != null && this.getPath().getLength() > 3) {
          this.getPath().removeAt(mev.vertex);
        }
      })

      // polygon.addListener('click', function (evt) {
      //   infoHeader.innerText = poi.name
      //   infoWindow.setPosition(evt.latLng)
      //   infoWindow.open(map)
      //   infoContent.poi = poi
      //   infoContent.marker = polygon
      // })

      polygon.setMap(map)
    } else {
      const img = new Image()
      img.src = `/karta/${poi.type}.png`
      img.style.width = '30px'

      const span = document.createElement('span')
      span.textContent = '👤'
      span.style.fontSize = '0.7rem'
      const pin = new PinElement({
        glyph: span,
        // borderColor: 'transparent',
        background: '#caff60',
        scale: 1
      })

      const marker = new AdvancedMarkerElement({
        position: new LatLng(poi.meta.position),
        map,
        title: poi.name,
        content: poi.type === 'customer' ? pin.element : img,
        gmpClickable: false, // Enabling this causes render issues...
        gmpDraggable: false,
      })

      // marker.addListener('dragend', function () {
      //   poi.meta.position = this.position.toJSON()

      //   supabase
      //     .from('poi')
      //     .upsert(poi)
      //     .then(console.log, console.error)
      // })

      marker.data = poi

      observer.observe(marker)
      const key = poi.meta.owner || (poi.type === 'customer' ? poi.id : undefined)
      allCustomersMarkers[key] ??= []
      allCustomersMarkers[key].push(marker)
      allMarkers[poi.id] = marker
    }
  })
  import('./karta/search.js')
})

const ArcLayer = deck.ArcLayer;
const GoogleMapsOverlay = deck.GoogleMapsOverlay;

function updateArcs (arcs) {
  const arcLayer = new ArcLayer({
    id: 'dynamic-arcs',
    data: arcs,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: [0, 0, 255],
    getTargetColor: [0, 255, 0],
    getWidth: 3
  })

  const overlay = new GoogleMapsOverlay({
    layers: [arcLayer],
  });

  // Koppla overlay till Google Maps-kartan
  overlay.setMap(map)
}

const sv = new StreetViewService()

globalThis.markHistory = []
map.addListener("click", evt => {
  console.log(11, evt.placeId)
})
$map.addEventListener('gmp-click', evt => {
  console.log(evt)
  const marker = evt.target
  const poi = marker.data
  globalThis.poi = poi
  globalThis.marker = marker
  markHistory.push(marker)
  document.querySelector('info-window-content').poi = marker.data

  if (poi.type !== 'customer' && !poi.meta.owner) {
    console.warn('Kunden har ingen huvudplats')
    return
  }

  const relatedMarkers = poi.type === 'customer'
    ? allCustomersMarkers[poi.id]
    : allCustomersMarkers[poi.meta.owner]

  makePlaceFromMarker(marker, relatedMarkers).then(place => {
    $place.place = place
  })

  // Hitta huvudplatsen för kunden
  const mainLocation = allMarkers[poi.meta.owner || poi.id]

  if (!mainLocation) {
    console.warn(`Ingen huvudplats hittades för kunden: ${customer}`)
    return
  }

  console.log('Relaterade markörer:', relatedMarkers)
  console.log('Huvudplatsen:', mainLocation)

  // Skapa arcs mellan huvudplatsen och de relaterade markörerna (exkludera huvudplatsen själv)
  const arcs = relatedMarkers
    .filter(marker => marker.data.id !== mainLocation.id)
    .map(marker => ({
      source: mainLocation.position.lngLat,
      target: marker.position.lngLat
    }))

  updateArcs(arcs)
})

Object.defineProperties(google.maps.LatLngAltitude.prototype, {
  latLng: { get () { return [this.lat, this.lng] } },
  lngLat: { get () { return [this.lng, this.lat] } }
})

Object.defineProperties(google.maps.LatLng.prototype, {
  latLng: { get () { return [this.lat(), this.lng()] } },
  lngLat: { get () { return [this.lng(), this.lat()] } }
})

google.maps.event.addListener(map, 'contextmenu', function(evt) {
  xFetch(
    'https://api.hitta.se/service-aggregator/v1/map/borders/at/' + evt.latLng.latLng.join(':'),
    { },
    { forwardRequestHeaders: false }
  )
    .then(r => r.json())
    .then(json => {
      const prop = json.features[0]?.properties
      if (!prop) return

      const {
        // Remove unwanted properties
        kommunnamn,
        nyabygglov,
        bygglov,
        blockenhet,
        lat,
        lng,
        id,
        // keep the rest
        ...hitta
      } = prop

      // Normalisera id to human text
      hitta.id = id[0].toUpperCase() + id.slice(1).toLowerCase()

      // Check if we already have a marker for this place
      // const owner = getAllCustomers().find(marker => {
      //   return marker.data.meta.hitta?.id === hitta.id
      // })

      // const customerMarker = Object.values(allCustomersMarkers).find(marker => {
      //   // console.log()
      //   if (marker[0].data.meta.hitta?.id === hitta.id) {
      //     return true
      //   }
      // })

      // Show an advanced marker
      const advancedMarker = new AdvancedMarkerElement({
        position: new LatLng(lat, lng),
        map,
        title: hitta.id,
        gmpClickable: true
      })

      const wrapperContent = document.createElement('div')
      const button = document.createElement('button')
      const pre = document.createElement('pre')
      wrapperContent.append(pre, button)

      pre.innerText = JSON.stringify(hitta, null, 2)
      infoWindow.setHeaderContent(hitta.id)
      infoWindow.setContent(wrapperContent)
      infoWindow.open(map, advancedMarker)

      button.innerText = 'Lägg till som kund'
      button.addEventListener('click', () => {
        supabase.from('poi').insert({
          name: hitta.id,
          description: '',
          type: 'customer',
          images: [],
          meta: {
            hitta,
            position: { lat, lng }
          }
        })
        .then(console.log, console.error)
      })

      map.panTo(advancedMarker.position)
    })
})

google.maps.event.addListener(map, 'click', function(event) {
  dispatch($map, 'wis-click', { position: event.latLng })
})

globalThis.infoWindow = new InfoWindow()

function sortMarkers (markers, referenceLocation) {
  // First calculate distances
  return markers.map(marker => ({
      marker,
      distance: google.maps.geometry.spherical.computeDistanceBetween(
        referenceLocation,
        marker.position
      )
    }))
    // then sort by distance
    .sort((a, b) => a.distance - b.distance)
    .map(item => item.marker)
}

/**
 * returns the 3 nearest customers to the referenceLocation
 * @param {*} [referenceLocation] - Defaults users own location
 */
function getNearestCustomers (referenceLocation = myLatLng()) {
  return sortMarkers(getAllCustomers(), referenceLocation).slice(0, 3)
}

function getNearestItems() {
  const referenceLocation = mousePosition // myLatLng()

  // Get the 3 nearest customers
  const nearestCustomers = getNearestCustomers(referenceLocation)

  // Get all markers for the 3 nearest customers
  let items = nearestCustomers.map(marker => allCustomersMarkers[marker.data.id]).flat()
    // exclude customers and polygons
    .filter(e => !['customer', 'polygon'].includes(e.data.type))

  return sortMarkers(items, referenceLocation)
}

let mousePosition
google.maps.event.addListener(map, 'mousemove', function (event) {
  mousePosition = event.latLng
});

window.e = getNearestItems

function summarize(result) {
  let meter = 0, sec = 0;
  const myroute = result.routes[0];

  if (!myroute) {
    return;
  }

  for (let leg of myroute.legs) {
    meter += leg.distance.value;
    sec += leg.duration.value;
  }

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec - hours * 3600) / 60);
  const km = meter / 1000;

  console.log('Total distance: ' + km + ' km');
  console.log('Total time: ' + hours + ' hours ' + minutes + ' minutes');
  // document.getElementById("total").innerHTML = total + " km";
}

/**
 * Dela upp en array i mindre grupper (chunks)
 * @param {Array} array - Array att dela upp
 * @param {number} size - Maxstorlek för varje chunk
 * @returns {Array[]} - Array av chunks
 */
function chunkArray(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Hämta vägbeskrivningar med flera waypoints i flera steg
 * @param {Array} legs - Array av waypoints
 * @param {Object} directionsService - Google Maps DirectionsService
 * @param {Object} directionsRenderer - Google Maps DirectionsRenderer
 */
async function getDirectionsWithChunks(legs, directionsService, directionsRenderer) {
  const chunkSize = 25
  const chunks = chunkArray(legs, chunkSize)
  let combinedResult = null

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const origin = i === 0 ? chunk.shift().location : combinedResult.routes[0].legs.slice(-1)[0].end_location
    const destination = i === chunks.length - 1 ? chunk.pop().location : chunk[chunk.length - 1].location

    const result = await directionsService.route({
      origin,
      destination,
      travelMode: TravelMode.DRIVING,
      unitSystem: UnitSystem.METRIC,
      waypoints: chunk,
      optimizeWaypoints: false,
      provideRouteAlternatives: false,
    })

    // Kombinera resultaten
    if (combinedResult) {
      combinedResult.request.waypoints = combinedResult.request.waypoints.concat(result.request.waypoints)
      combinedResult.geocoded_waypoints = combinedResult.geocoded_waypoints.concat(result.geocoded_waypoints)
      combinedResult.routes[0].legs = combinedResult.routes[0].legs.concat(result.routes[0].legs)
      combinedResult.routes[0].overview_path = combinedResult.routes[0].overview_path.concat(result.routes[0].overview_path)
    } else {
      combinedResult = result
    }
  }
  combinedResult.routes[0].waypoint_order = Array.from({ length: legs.length }, (_, i) => i)

  globalThis.result = combinedResult
  directionsRenderer.setDirections(combinedResult)
}

const renderers = []

/**
 * Rendera alla chunks på kartan
 * @param {Array} chunks - Array av waypoint-chunks
 */
async function renderAllChunks(chunks) {
  const promises = chunks.map(async (chunk, index) => {
    const origin = index === 0 ? chunk.shift().location : chunks[index - 1].slice(-1)[0].location
    const destination = index === chunks.length - 1 ? chunk.pop().location : chunk[chunk.length - 1].location

    // Hämta rutt för aktuell chunk
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      waypoints: chunk,
      optimizeWaypoints: false,
      provideRouteAlternatives: false,
    })

    // Skapa renderer för aktuell rutt
    const directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      map,
    })
    directionsRenderer.setDirections(result)

    // Lägg till listener för ändringar
    directionsRenderer.addListener('directions_changed', () => {
      const updatedResult = directionsRenderer.getDirections()
      chunks[index] = updatedResult.request.waypoints
      console.log(`Chunk ${index} updated:`, chunks[index])
    })

    renderers.push(directionsRenderer)
  })

  // Vänta på att alla rutter renderas
  await Promise.all(promises)
}

/**
 * Rensa alla renderers från kartan
 */
function clearAllRenderers() {
  renderers.forEach(renderer => renderer.setMap(null))
  renderers.length = 0
}


async function calculateAndDisplayRoute(directionsService, directionsRenderer) {
  const d = globalThis.workWork

  if (d.length > 25) {

    const chunks = chunkArray(d, 25)
    await renderAllChunks(chunks)

    return
  }

  const result = await directionsService.route({
    origin: d.shift().location,
    destination: d.pop().location,
    travelMode: TravelMode.DRIVING,
    // drivingOptions: {},
    unitSystem: UnitSystem.METRIC,
    provideRouteAlternatives: true,
    waypoints: d,
    optimizeWaypoints: true,
  })
  globalThis.result = result
  // Hämta start, slut och waypoints från result
  const origin = result.routes[0].legs[0].start_location.toUrlValue()
  const destination = result.routes[0].legs[result.routes[0].legs.length - 1].end_location.toUrlValue()
  const waypoints = result.routes[0].legs
    .slice(1, -1) // Alla ben mellan start och slut
    .map(leg => leg.start_location.toUrlValue())
    .join('|') // Separera waypoints med |

  // Skapa URL
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`

  const linkRide = document.createElement('a')
  linkRide.innerText = 'öppna i google maps'
  linkRide.href = url

  document.body.append(linkRide)

  directionsRenderer.setDirections(result);
}

const directionsRenderer = new google.maps.DirectionsRenderer({
  draggable: true,
  panel: $directionPanel,
  routeIndex: 200,
  suppressBicyclingLayer: true,
  markerOptions: {
    animation: google.maps.Animation.BOUNCE,
    shape: 'circle'
  },
  map
})
const directionsService = new google.maps.DirectionsService()

globalThis.directionsRenderer = directionsRenderer
globalThis.directionsService = directionsService

globalThis.calculateAndDisplayRoute = calculateAndDisplayRoute.bind(null, directionsService, directionsRenderer)

directionsRenderer.addListener('directions_changed', () => {
  const directions = directionsRenderer.getDirections()
  if (directions) summarize(directions)
})

globalThis.foo = async function foo () {
  const jobs = markHistory.map(elm => ({
    id: elm.data.id,
    location: elm.position.lngLat,
    service: 300,
  }))

  const sample = {
    vehicles: [
      {
        id: 1,
        start: [ myLatLng().lng, myLatLng().lat ],
        // end: jobs.pop().location,
      },
    ],
    jobs
  }

  const q = new URLSearchParams({
    cors: JSON.stringify({
      url: 'http://solver.vroom-project.org/',
    })
  })

  const response = await fetch('https://adv-cors.deno.dev/?' + q, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample)
  })

  const text = await response.text()
  const { routes } = JSON.parse(text, (key, value) => {
    return key === 'location' ? { lat: value[1], lng: value[0] } : value
  })

  globalThis.workWork = routes[0].steps.slice(1, -1).map(step => {
    return {
      location: step.location,
      stopover: true
    }
  })

  globalThis.calculateAndDisplayRoute()
}

/*
    import('./karta/rita.js')

    // Adds a search box to the map
    // Create the input HTML element, and append it.
    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement()
    placeAutocomplete.style.margin = '10px'
    placeAutocomplete.style.height = '40px'

    // Don't currently have a better way to style the input
    placeAutocomplete.Yg.querySelector('input').style.background = 'white'
    placeAutocomplete.Yg.querySelector('input').style.color = 'black'

    placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
      await place.fetchFields({ fields: ["*"] })

      const bounds = new google.maps.LatLngBounds()

      console.log(window.place = place)

      place.viewport
        ? bounds.union(place.viewport)
        : bounds.extend(place.location)

      map.fitBounds(bounds)

      // Create a advanceMarker for the selected place
      const advanceMarker = new google.maps.marker.AdvancedMarkerElement({
        position: place.location,
        map,
        title: place.name,
        gmpClickable: true,
      })

      advanceMarker.data = {
        name: place.formattedAddress,
        viewport: place.viewport.toJSON(),
        location: place.location.toJSON(),
        formattedAddress: place.formattedAddress,
        addressComponents: JSON.parse(JSON.stringify(place.addressComponents))
      }
    })

    // Add the control to the map
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(placeAutocomplete)

    const infoHeader = document.createElement('h3')
    infoHeader.contentEditable = true
    infoHeader.addEventListener("input", function() {
      infoContent.poi.name = this.innerText.trim()
    })

    const infoContent = document.createElement('info-window-content')
    infoHeader.style.color = 'black'
    infoHeader.style.margin = '0'



    on(wrapperDiv, 'gmp-click', 'gmp-advanced-marker', evt => {
      globalThis.marker = evt.target
    })

    // support for adding hole into an existing polygon
    wrapperDiv.addEventListener('overlaycomplete', event => {
      const overlay = event.detail
      const newHole = overlay.getPath().getArray()
      // remove the new hole from the map
      if (window.e === 1) {
        overlay.setMap(null)
        addHoleToPolygon(newHole)
      }
    })

    function addHoleToPolygon(hole) {
      const paths = polygon.getPaths()
      console.log(paths)
      paths.push(new google.maps.MVCArray(hole)) // Lägg till hålet som en ny del i paths
    }
*/

/*
  // const Map3DElement = await google.maps.importLibrary("maps3d")
  // console.log(Map3DElement.connectForExplicitThirdPartyLoad())

  // const trafficLayer = new google.maps.TrafficLayer();
  // trafficLayer.setMap(map);


  // administrative.land_parcel
  // poi
  // poi.business
  // poi.park
  // road.local
  // transit

  const hidden = [{ visibility: 'off' }]
  const hideThis = ['poi', 'transit'].map(type => ({
    featureType: type,
    stylers: hidden
  }))

  map.setOptions({ styles: hideThis })

  const url = 'https://www.google.com/maps/d/u/0/kml?&mid=1PfuT8HE2SPOIJjEMg9tqt7NL9kNOLXg'
  // const url = 'https://www.google.com/maps/d/u/0/kml?forcekml=1&mid=1PfuT8HE2SPOIJjEMg9tqt7NL9kNOLXg'
  const res = await fetch('/api/cors?url=' + encodeURIComponent(url))
  const blob = await res.blob()
  const { default : zipReader } = await import('https://cdn.jsdelivr.net/npm/zip-go@1.0.1/lib/read.js')
  const files = {}

  for await (const entry of zipReader(blob)) {
    const file = await entry.file()
    files[entry.name] = entry.name.includes('image') ? URL.createObjectURL(file.slice(0, 999999, 'image/png')) : file
  }
*/


// context = new AudioContext()
// source = context.createBufferSource()
// source.connect(context.destination)
// source.start(0)

/* <audio loop controls src="https://github.com/anars/blank-audio/raw/refs/heads/master/1-hour-of-silence.mp3"></audio> */



var polylines = []
var placeIdArray = []
var snappedCoordinates = []
var data

// Snap-to-road when the polyline is completed.
drawingManager.addListener('polylinecomplete', function(poly) {
  var path = poly.getPath();
  polylines.push(poly);
  placeIdArray = [];
  runSnapToRoad(path);
});


// Snap a user-created polyline to roads and draw the snapped path
async function runSnapToRoad(path) {
  var pathValues = [];
  for (var i = 0; i < path.getLength(); i++) {
    pathValues.push(path.getAt(i).toUrlValue());
  }

  const q = new URLSearchParams({
    interpolate: 'true',
    path: pathValues.join('|'),
    key: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg'
  })

  const json = await fetch('https://roads.googleapis.com/v1/snapToRoads?' + q)
  data = await json.json()
  console.log(data)
  processSnapToRoadResponse(data);
  drawSnappedPolyline();
}

// Store snapped polyline returned by the snap-to-road service.
function processSnapToRoadResponse(data) {
  snappedCoordinates = [];
  placeIdArray = [];
  for (var i = 0; i < data.snappedPoints.length; i++) {
    var latlng = new google.maps.LatLng(
        data.snappedPoints[i].location.latitude,
        data.snappedPoints[i].location.longitude);
    snappedCoordinates.push(latlng);
    placeIdArray.push(data.snappedPoints[i].placeId);
  }
}

// Draws the snapped polyline (after processing snap-to-road response).
function drawSnappedPolyline() {
  var snappedPolyline = new google.maps.Polyline({
    path: snappedCoordinates,
    strokeColor: '#add8e6',
    strokeWeight: 4,
    strokeOpacity: 0.9,
  });

  snappedPolyline.setMap(map);
  polylines.push(snappedPolyline);
}


// simulateWatchPosition
setTimeout(async () => {
  return
  console.log({
    origin: getAllCustomers()[1].position,
    destination: getAllCustomers()[2].position
  })

  const result = await directionsService.route({
    origin: getAllCustomers()[1].position,
    destination: getAllCustomers()[22].position,
    travelMode: TravelMode.DRIVING,
    unitSystem: UnitSystem.METRIC,
    provideRouteAlternatives: false,
    waypoints: [],
    optimizeWaypoints: false,
  })

  const steps = result.routes[0].legs.map(e => e.steps).flatMap(e => {
    return e.map(e => {
      return {
        distanceInMeter: e.distance.value,
        durationInSeconds: e.duration.value,
        path: e.path.map(e => e.toJSON())
      }
    })
  })
  console.log(steps)
  console.log(preCalc(steps))
  emulateWatchPosition(steps, onUpdate)

  // simulateWatchPosition(route, (pos) => {
  //   onUpdate(pos)
  // }, console.error)

  // setInterval(() => {
  //   map.panTo(myLatLng())
  // }, 2000)
}, 1000)

/**
 * @typedef {Object} PathPoint
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} RouteSegment
 * @property {number} distanceInMeter
 * @property {number} durationInSeconds
 * @property {PathPoint[]} path
 */

/**
 * @typedef {RouteSegment[]} Route
 */

/**
 * Simulerar navigator.geolocation.watchPosition baserat på en given rutt.
 * @param {Route} route
 * @param {(pos: GeolocationPosition) => void} successCallback
 * @returns {() => void} Stop function
 */
export function emulateWatchPosition(route, successCallback) {
  let startTime = performance.now()
  let stop = false

  function interpolatePosition(segment, elapsedTime) {
    const speed = segment.distanceInMeter / segment.durationInSeconds // m/s
    let traveledDistance = speed * elapsedTime // Meter

    for (let i = 0; i < segment.path.length - 1; i++) {
      const p1 = segment.path[i]
      const p2 = segment.path[i + 1]
      const segmentDistance = haversineDistance(p1, p2)

      if (traveledDistance < segmentDistance) {
        const ratio = traveledDistance / segmentDistance
        return {
          lat: p1.lat + (p2.lat - p1.lat) * ratio,
          lng: p1.lng + (p2.lng - p1.lng) * ratio
        }
      }
      traveledDistance -= segmentDistance
    }
    return segment.path[segment.path.length - 1]
  }

  function update() {
    if (stop) return
    const elapsed = (performance.now() - startTime) / 1000 // Sekunder
    let accumulatedTime = 0

    for (const segment of route) {
      accumulatedTime += segment.durationInSeconds
      if (elapsed < accumulatedTime) {
        const position = interpolatePosition(segment, elapsed - (accumulatedTime - segment.durationInSeconds))
        successCallback({
          coords: {
            latitude: position.lat,
            longitude: position.lng,
            speed: segment.distanceInMeter / segment.durationInSeconds,
            // heading: calculateHeading(segment.path)
          },
          timestamp: Date.now()
        })
        requestAnimationFrame(update)
        return
      }
    }
  }
  requestAnimationFrame(update)
  return () => { stop = true }
}

/**
 * Beräknar Haversine-avstånd mellan två punkter.
 * @param {PathPoint} p1
 * @param {PathPoint} p2
 * @returns {number} Distance in meters
 */
function haversineDistance(p1, p2) {
  const R = 6371000 // Jordens radie i meter
  const dLat = toRadians(p2.lat - p1.lat)
  const dLng = toRadians(p2.lng - p1.lng)
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(p1.lat)) * Math.cos(toRadians(p2.lat)) *
            Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Omvandlar grader till radianer.
 * @param {number} degrees
 * @returns {number}
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}




/**
 * @typedef {Object} PathPoint
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {number} meterFromPrev - Distance from previous point in meters
 * @property {number} travelTimeInSec - Travel time to reach this point in seconds
 */

/**
 * @typedef {PathPoint[]} Route
 */

function preCalc(temp1) {
  let prev = temp1[0].path[0]

  for (const leg of temp1) {
    const { distanceInMeter, durationInSeconds } = leg
    const factor = durationInSeconds / distanceInMeter
    for (const path of leg.path) {
      const d = google.maps.geometry.spherical.computeDistanceBetween(prev, path)
      prev = path
      path.meterFromPrev = d
      path.travelTimeInSec = d * factor
    }
  }
  console.log(Math.max(...temp1.map(e => e.path).flat().map(e => e.travelTimeInSec)))
  return temp1.map(e => e.path).flat()
}
