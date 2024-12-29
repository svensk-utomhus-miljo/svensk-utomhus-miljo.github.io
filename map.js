import { on } from './event.js'
import { currentPosition, myLatLng } from './geo.js'
import { supabase } from './db.js'
import './info-window-content.js'

import('https://maps.googleapis.com/maps/api/js?loading=async&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=beta')

const wrapperDiv = document.createElement('div')
wrapperDiv.style.height = '400px'

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

on(wrapperDiv, 'click', 'gmp-advanced-marker', event => {
  const [ marker ] = event.composedPath()

  window.m = marker
  // Create a new info window
  // new google.maps.InfoWindow({
  //   content: marker.data.adrFormatAddress,
  //   headerContent: marker.title,
  //   position: marker.position,
  // }).open(marker.map)
})

// Create some CSS to apply to the shadow dom
const style = document.createElement("style");

style.textContent = `
  gmp-place-autocomplete {
    background-color: white;
  }
  gmp-place-autocomplete input {
    background-color: white !important;
  }
`

class MapView extends HTMLElement {
  static observedAttributes = ["color", "size"];

  constructor() {
    // Always call super first in constructor
    super()
  }

  connectedCallback() {
    console.log('Custom element added to page.')
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.append(wrapperDiv, style)
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed.`);
  }

  static async initMap() {
    await Promise.all([
      google.maps.importLibrary("marker"),
      google.maps.importLibrary("drawing"),
      google.maps.importLibrary("geometry"),
      google.maps.importLibrary("maps"),
      google.maps.importLibrary("places"),
    ])

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
      center: { lat: 59.25317086818823, lng: 17.878106442652452 },
      zoom: 17,
      clickableIcons: false,
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

    // import { ArcLayer} from "deck.gl";
    // import { GoogleMapsOverlay } from "@deck.gl/google-maps";

    const ArcLayer = deck.ArcLayer;
    const GoogleMapsOverlay = deck.GoogleMapsOverlay;

    function updateArcs (arcs) {
      const arcLayer = new ArcLayer({
        id: 'dynamic-arcs',
        data: arcs,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: [0, 128, 255],
        getTargetColor: [255, 0, 128],
        getWidth: 2
      })

      const overlay = new GoogleMapsOverlay({
        layers: [arcLayer],
      });

      // Koppla overlay till Google Maps-kartan
      overlay.setMap(map)
    }


    // overlay.setMap(map);
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom()

      if (zoom) {
        allMarkers.forEach(marker => {
          if (!(marker.data?.type === 'pin' || marker.data?.type === 'customer')) {
            marker.setMap(zoom > 15 ? map : null)
          }
        })
      }
    })

    const directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      map
    })
    const directionsService = new google.maps.DirectionsService()

    globalThis.map = map
    globalThis.directionsService = directionsService

    globalThis.calculateAndDisplayRoute = calculateAndDisplayRoute.bind(null, directionsService, directionsRenderer)

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

    map.userMarker = new google.maps.marker.AdvancedMarkerElement({
      position: myLatLng(),
      content: you,
      map,
    })

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

    wrapperDiv.addEventListener('gmp-click', evt => {
      console.log(1)
      const marker = evt.target
      const poi = marker.data
      window.poi = poi
      window.marker = marker
      infoHeader.innerText = poi?.name
      infoWindow.setPosition(marker.position)
      infoContent.poi = poi
      infoContent.marker = marker
      infoWindow.open(map)


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

      if (!mainLocation) {
        console.warn(`Ingen huvudplats hittades för kunden: ${customer}`)
        return
      }

      console.log('Relaterade markörer:', relatedMarkers)
      console.log('Huvudplatsen:', mainLocation)

      function toLatLong (latLng) {
        return [latLng.lng, latLng.lat]
      }

      // Skapa arcs mellan huvudplatsen och de relaterade markörerna (exkludera huvudplatsen själv)
      const arcs = relatedMarkers
        .filter(marker => marker.data.id !== mainLocation.id)
        .map(marker => ({
          source: toLatLong(mainLocation.position),
          target: toLatLong(marker.position)
        }))

      updateArcs(arcs)
    })

    // fetch('/solution.json').then(async res => {
    //   const json = await res.json()
    //   const paths = google.maps.geometry.encoding.decodePath(json.routes[0].geometry)

    //   const directions = new google.maps.Polyline({
    //     strokeColor: "#0000FF",
    //     path: paths,
    //   });
    //   directions.setMap(map)
    // })

    globalThis.allMarkers = []


    // Skapa en custom Tile Overlay
    const customTileLayer = new google.maps.ImageMapType({
      getTileUrl (coord, zoom) {
        if (zoom < 17 || zoom > 20 || map.mapTypeId !== 'satellite') return ''
        return `https://api.hitta.se/image/v2/realestate/g/${zoom}/${coord.x}/${coord.y}?v=18032023`
      },
      tileSize: new google.maps.Size(256, 256),
      opacity: 1,
      name: 'Hitta.se Estate'
    })

    globalThis.customTileLayer = customTileLayer

    // Lägg till tile-lagret på kartan
    map.overlayMapTypes.insertAt(0, customTileLayer)

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

            polygon.addListener('click', function (evt) {
              infoHeader.innerText = poi.name
              infoWindow.setPosition(evt.latLng)
              infoWindow.open(map)
              infoContent.poi = poi
              infoContent.marker = polygon
            })

            polygon.setMap(map)
          } else {
            // console.log(poi.meta.icon)

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
              gmpDraggable: true,
            })

            marker.addListener('dragend', function () {
              poi.meta.position = this.position.toJSON()

              supabase
                .from('poi')
                .upsert(poi)
                .then(console.log, console.error)
            })

            marker.data = poi

            allMarkers.push(marker)
          }
        })
      })

  }
}

globalThis.initMap = MapView.initMap
customElements.define('map-view', MapView)

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
  globalThis.allMarkers = []

  supabase.from('poi').select('*')
  // .eq('customer', 0)
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
          editable: true,
          poi,
          // dragable: true,
        })
        allMarkers.push(polygon)
        polygon.addListener('rightclick', function (mev) {
          console.log(this.poi)
          if (mev.vertex != null && this.getPath().getLength() > 3) {
              this.getPath().removeAt(mev.vertex);
          }
        })

        polygon.setMap(map)
      } else {
        const marker = new google.maps.Marker({
          position: poi.meta.position,
          map,
          title: poi.name,
          poi,
          draggable: true,
          animation: google.maps.Animation.DROP,
          crossOnDrag: !false,
          raiseOnDrag: !true,
          icon: {
            url: files[poi.meta.icon],
            scaledSize: new google.maps.Size(25, 25),
          },
        })

        allMarkers.push(marker)
        const header = document.createElement('h1')
        header.textContent = poi.name
        header.style.color = 'black'

        // marker.addListener('click', function (...args) {
        //   console.log(this, args)
        // })

        // marker.addListener('click', () => {
        //   new google.maps.InfoWindow({
        //     // content: poi.images.map(src => {
        //     //   const img = new Image()
        //     //   img.src = src
        //     //   return img
        //     // }),
        //     content: JSON.stringify(poi),
        //     headerContent: poi.name,
        //     headerDisabled: false,
        //     position: poi.meta.position,
        //   }).open(map)
        // })
      }
    })
  })

}
*/


// UPDATE poi
// SET
//   type = 'christmas-tree',
//   meta = meta - 'icon'
// WHERE
//   meta->>'icon' = 'images/icon-14.png';



// SELECT *
// FROM poi
// WHERE meta->>'icon' = 'images%';


// context = new AudioContext()
// source = context.createBufferSource()
// source.connect(context.destination)
// source.start(0)

/* <audio loop controls src="https://github.com/anars/blank-audio/raw/refs/heads/master/1-hour-of-silence.mp3"></audio> */
