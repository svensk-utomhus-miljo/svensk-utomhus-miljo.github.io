import { on, dispatch } from './event.js'
import { currentPosition, myLatLng } from './geo.js'
import { supabase } from './db.js'
import './info-window-content.js'
import { placeElement } from './main.js'
import { makePlaceFromMarker } from './fake.js'
globalThis.supabase = supabase
const allMarkers = []
globalThis.allMarkers = allMarkers

let zoomedIn = map.getZoom() > 16.48

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
const customTileLayer = new google.maps.ImageMapType({
  getTileUrl (coord, zoom) {
    if (zoom < 17 || map.mapTypeId !== 'satellite') return ''
    return `https://api.hitta.se/image/v2/realestate/g/${zoom}/${coord.x}/${coord.y}?v=18032023`
  },
  tileSize: new google.maps.Size(256, 256),
  opacity: 1,
  name: 'Hitta.se Estate'
})

on(map, 'zoomedIn', () => {
  allMarkers.forEach(marker => {
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
  allMarkers.forEach(marker => {
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

    supabase
      .from('poi')
      .upsert(polygon.data)
      .then(console.log, console.error)
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
    if (poi.type === 'polygon') {
      const polygon = new google.maps.Polygon({
        paths: poi.meta.paths,
        strokeColor: poi.meta.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: poi.meta.color,
        fillOpacity: 0.32,
        editable: false,
        clickable: true,
        data: poi,
      })

      listenToPolygonChanges(polygon)

      allMarkers.push(polygon)

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
      const pin = new google.maps.marker.PinElement({
        glyph: span,
        // borderColor: 'transparent',
        background: '#caff60',
        scale: 1
      })

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.meta.position,
        map,
        title: poi.name,
        content: poi.type === 'customer' ? pin.element : img,
        gmpClickable: true,
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

      allMarkers.push(marker)
    }
  })
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

document.body.addEventListener('gmp-click', evt => {
  const marker = evt.target
  const poi = marker.data
  window.poi = poi
  window.marker = marker

  // Hämta marker som klickades på
  const customer = poi.customer

  if (!customer) {
    console.warn('Den klickade markören tillhör ingen kund.')
    return
  }

  // Hitta alla markörer som tillhör samma kund
  const relatedMarkers = allMarkers.filter(marker => {
    if (marker.data.type === 'polygon') return false
    return marker.data?.customer === customer
  })

  // Hitta huvudplatsen för kunden
  const mainLocation = relatedMarkers.find(marker => marker.data.type === 'customer')

  const images = relatedMarkers.map(poi => poi.data.images).flat().filter(Boolean)

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
      source: mainLocation.position.latLng,
      target: marker.position.latLng
    }))

  updateArcs(arcs)

  makePlaceFromMarker(marker, relatedMarkers).then(place => {
    placeElement.place = place
  })
})

Object.defineProperties(google.maps.LatLngAltitude.prototype, {
  latLng: {
    get () { return [this.lng, this.lat] }
  }
})

Object.defineProperties(google.maps.LatLng.prototype, {
  latLng: {
    get () { return [this.lng, this.lat] }
  }
})

/*
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

    const infoWindow = new google.maps.InfoWindow({
      headerContent: infoHeader,
      content: infoContent,
    })

    globalThis.infoWindow = infoWindow

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
