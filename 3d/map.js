import { on, dispatch } from './event.js'
// import { currentPosition, myLatLng } from './geo.js'
import { supabase } from './db.js'
import './info-window-content.js'
import { $place, $map } from './main.js'
import { makePlaceFromMarker } from './fake.js'
import './reactive.js'
import { Poi } from './poi.js'
import './karta/rita.js'


const { InfoWindow, LatLng, LatLngAltitude, Polygon, Size, ImageMapType, StreetViewService } = google.maps
const { PinElement, AdvancedMarkerElement } = google.maps.marker
const { Marker3DElement, Marker3DInteractiveElement, Model3DElement } = google.maps.maps3d

globalThis.supabase = supabase
globalThis.allMarkers = {}
globalThis.allCustomersMarkers = {}
globalThis.getAllCustomers = getAllCustomers


function getAllCustomers () {
  return Object.keys(allCustomersMarkers)
    .filter(key => key !== 'undefined')
      .map(key => allMarkers[key])
}

// let zoomedIn = map.getZoom() > 16.48

// const observer = new IntersectionObserver(entries => {
//   entries.forEach(entry => {
//     entry.target.gmpClickable = entry.isIntersecting
//   })
// }, {
//   root: map.getDiv(),
//   rootMargin: "0px",
//   threshold: 1.0
// })

// globalThis.observer = observer

/*
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
*/

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
/*
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
*/

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
// map.overlayMapTypes.insertAt(0, customTileLayer)

const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>`], { type: 'image/svg+xml' })
const parser = new DOMParser();
const pinSvgString = '<svg height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 508 508" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle style="fill:#FF7058;" cx="254" cy="254" r="254"></circle> <path style="fill:#324A5E;" d="M218,146l9.2-26h53.6l9.2,26h16.8L294,109.2c-1.2-3.2-4-5.2-7.6-5.2h-64.8c-3.2,0-6.4,2-7.6,5.2 L201.2,146H218z"></path> <path style="fill:#E6E9EE;" d="M316.8,435.2H191.2c-14.8,0-26.8-11.2-28.4-25.6L140.4,174h227.2l-22.4,235.2 C343.6,424,331.6,435.2,316.8,435.2z"></path> <path style="fill:#FFFFFF;" d="M369.6,174H138.4c-9.6,0-17.6-8-17.6-17.6l0,0c0-9.6,8-17.6,17.6-17.6h231.2c9.6,0,17.6,8,17.6,17.6 l0,0C387.2,166.4,379.2,174,369.6,174z"></path> <g> <path style="fill:#324A5E;" d="M226,256.4l16.8,7.6c1.6,0.8,3.6,0,4.4-1.6l6.8-12.8l15.2,28l0.8,1.6l-7.2,4c-2.8,1.6-2,5.6,0.8,6.4 l27.2,7.2c2,0.4,4-0.8,4.4-2.4l7.2-27.2c0.8-3.2-2.4-5.6-5.2-4l-5.2,3.2l-23.2-43.2l0,0l0,0l0,0l0,0h-26.4c-1.2,0-2.4,0.8-3.2,2 l-14.4,26.4C223.2,253.2,224,255.6,226,256.4z"></path> <path style="fill:#324A5E;" d="M309.2,299.2c-0.8-1.6-3.2-2.4-4.8-1.2l-15.6,9.2c-1.6,0.8-2.4,3.2-1.2,4.8l6,11.2H268V316 c0-3.2-3.6-4.8-6-2.4l-20,19.6c-1.2,1.2-1.2,3.6,0,4.8l20,20c2.4,2.4,6,0.8,6-2.4v-7.2h37.2c1.2,0,2.4-0.8,3.2-1.6l14-23.2 L309.2,299.2z"></path> <path style="fill:#324A5E;" d="M240.8,297.2l-9.6-26.4c-0.8-2-2.8-2.8-4.4-2l-26.4,9.6c-2.8,1.2-3.2,5.2-0.4,6.4l4.8,2l-18.4,34 c-0.4,1.2-0.4,2.4,0,3.6l14,23.2H230c2,0,3.6-1.6,3.6-3.6v-18c0-2-1.6-3.6-3.6-3.6h-16l13.6-25.6l8.4,4 C239.2,302.8,242,300,240.8,297.2z"></path> </g> </g></svg>';
const pinSvg = parser.parseFromString(pinSvgString, "image/svg+xml",).documentElement;

const url = new URL(URL.createObjectURL(blob))

supabase.from('poi').select('*')
.then(result => {
  result.data?.forEach(poi => {
    poi = Poi(poi)
    if (poi.type === 'polygon') {

      const polygonOptions = {
        strokeColor: "#EA4335",
        strokeWidth: 4,
        fillColor: 'rgba(202, 23, 23, 0.32)',
        altitudeMode: 'RELATIVE_TO_GROUND',
        extruded: true,
        drawsOccludedSegments: false,
      }

      const towerPolygon = new google.maps.maps3d.Polygon3DElement(polygonOptions)
      const coords = poi.meta.paths.map(e => new LatLngAltitude({
        lat: e.lat || 0,
        lng: e.lng || 0,
        altitude: 10
      }))

      towerPolygon.outerCoordinates = coords
      globalThis.towerPolygon = towerPolygon

      $map.append(towerPolygon)

      // Add round anchor points to the polygon
      poi.meta.paths.forEach((path, i) => {
        return
        const marker = new Marker3DInteractiveElement({
          position: {...path, altitude: 0},
          altitudeMode: 'RELATIVE_TO_GROUND',
        })

        // append a svg circle to the marker
        const templateForSvg = document.createElement('template')
        templateForSvg.content.append(pinSvg.cloneNode(true))

        marker.append(templateForSvg)


        $map.append(marker)
      })

      return

      const polygon = new google.maps.maps3d.Polygon3DElement({
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

      return
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
      img.src = new URL('http://localhost:5173/karta/pin.png')+''
      img.style.width = '30px'

      const span = document.createElement('span')
      span.textContent = '👤'
      span.style.fontSize = '0.7rem'
      const pin = new PinElement({
        glyph: pinSvg,
        // background: '#caff60',
        scale: 1
      })

      const marker = new Marker3DInteractiveElement({
        position: {...poi.meta.position, altitude: 10},
        label: poi.name,
        altitudeMode: 'RELATIVE_TO_GROUND',
        extruded: true,
      })

      const templateForSvg = document.createElement('template')
      templateForSvg.content.append(pinSvg.cloneNode(true))

      marker.append(templateForSvg)

      marker.addEventListener('click', (e) => {
        console.log('clicked', e)
      })
      // const marker = new AdvancedMarkerElement({
      //   position: poi.meta.position,
      //   map,
      //   title: poi.name,
      //   content: poi.type === 'customer' ? pin.element : img,
      //   gmpClickable: false, // Enabling this causes render issues...
      //   gmpDraggable: false,
      // })

      // marker.addListener('dragend', function () {
      //   poi.meta.position = this.position.toJSON()

      //   supabase
      //     .from('poi')
      //     .upsert(poi)
      //     .then(console.log, console.error)
      // })

      marker.data = poi

      // observer.observe(marker)
      const key = poi.meta.owner || (poi.type === 'customer' ? poi.id : undefined)
      allCustomersMarkers[key] ??= []
      allCustomersMarkers[key].push(marker)
      allMarkers[poi.id] = marker
      $map.append(marker)
    }
  })
})





const position = {lat: 59.252285753120425, lng: 17.877159710399514, altitude: 10}
const altitudeMode = 'RELATIVE_TO_GROUND'
const orientation = {tilt: -90, heading: 0, roll: 0}

const model = new Model3DElement({
  src: 'http://localhost:5173/3d/karta/bin.glb',
  position,
  altitudeMode,
  orientation,
  scale: 1,
});

$map.append(model);
globalThis.model = model
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

$map.addEventListener('gmp-click', evt => {
  const marker = evt.target
  const poi = marker.data
  window.poi = poi
  window.marker = marker

  return

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

/*
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
*/

/**
    function calculateAndDisplayRoute(directionsService, directionsRenderer) {
      const d = globalThis.workWork

      directionsService
        .route({
          origin: myLatLng(),
          destination: d.pop().location,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          provideRouteAlternatives: false,
          waypoints: d,
          optimizeWaypoints: !true,
        })
        .then(result => {
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
        }, console.error)
    }

    const map = new google.maps.Map(wrapperDiv, {
      // heading: 320,
      // tilt: 47.5,
      // default to satellite view
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      mapId: '6ff586e93e18149f',
      collisionBehavior: google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
      // mapTypeControlOptions: {
      //   mapTypeIds: ['roadmap', 'satellite', 'terrain', 'custom']
      // }
    })

    import('./karta/rita.js')

    const directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      map
    })
    const directionsService = new google.maps.DirectionsService()

    globalThis.directionsService = directionsService

    globalThis.calculateAndDisplayRoute = calculateAndDisplayRoute.bind(null, directionsService, directionsRenderer)

    google.maps.event.addListener(map, 'click', (evt) => {
      globalThis.infoWindow.close()
      console.log(evt.domEvent, evt.domEvent.currentTarget, evt.domEvent.fromElement, evt.domEvent.srcElement)
    })

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
  // If we ever want to play with 3D maps
  //
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
