import { on } from './event.js'
import { currentPosition, myLatLng } from './geo.js'

import('https://maps.googleapis.com/maps/api/js?loading=async&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=beta')
import('./db.js')

const wrapperDiv = document.createElement('div')
wrapperDiv.style.height = '400px'

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
    })

    const directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      map
    });
    const directionsService = new google.maps.DirectionsService();

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

    // Lägg till eventlistener på knappen

    const pin = new google.maps.marker.PinElement({
      scale: .5,
      glyphColor: "",
      glyph: "", // hide the glyph
    });
    const you = document.createElement('span')
    you.textContent = '🚗'
    you.style.fontSize = '1.4rem'

    console.log(111, myLatLng()) // varför loggas inte detta?


    map.userMarker = new google.maps.marker.AdvancedMarkerElement({
      position: myLatLng(),
      content: you,
      map,
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
      await place.fetchFields({ fields: ["*"] });

      const bounds = new google.maps.LatLngBounds()

      place.viewport
        ? bounds.union(place.viewport)
        : bounds.extend(place.location)

      map.fitBounds(bounds)

      // Create a advanceMarker for the selected place
      const advanceMarker = new google.maps.marker.AdvancedMarkerElement({
        position: place.location,
        map,
        title: place.name,
        gmpDraggable: true,
        gmpClickable: true,
      })
      advanceMarker.data = place
      globalThis.m = advanceMarker
      advanceMarker.addEventListener("dragstart", e => {
        console.log('dragstart', e)
      })
    })
    // Add the control to the map
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(placeAutocomplete)

    // fetch('/solution.json').then(async res => {
    //   const json = await res.json()
    //   const paths = google.maps.geometry.encoding.decodePath(json.routes[0].geometry)

    //   const directions = new google.maps.Polyline({
    //     strokeColor: "#0000FF",
    //     path: paths,
    //   });
    //   directions.setMap(map)
    // })
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




  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: !true,
    // markerOptions: {
    //   // icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
    // },
    polygonOptions: {
      fillColor: "#FF5252",
      fillOpacity: 0.3,
      strokeColor: "#FF0000",
      strokeWeight: 3,
      clickable: !true,
      editable: !true,
      zIndex: 1,
    },
    circleOptions: {
      fillColor: "#ffff00",
      fillOpacity: 1,
      strokeWeight: 5,
      clickable: !false,
      editable: !true,
      zIndex: 1,
    }
  })

  drawingManager.setMap(map)

  globalThis.map = map
  globalThis.drawingManager = drawingManager

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