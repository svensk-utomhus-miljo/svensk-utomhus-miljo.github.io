import './reg-sw.js'
import { nn } from './util.js'
// import {ai} from './ai.js'

const components = await import('https://unpkg.com/@googlemaps/extended-component-library')

const { setStringLiterals, APILoader } = components
const maps = await APILoader.googleMapsDeferred.promise

await Promise.all([
  maps.importLibrary("marker"),
  maps.importLibrary("drawing"),
  maps.importLibrary("geometry"),
  maps.importLibrary("maps"),
  maps.importLibrary("core"),
  maps.importLibrary("places"),
  maps.importLibrary("maps3d"),
])

setStringLiterals({
  // PLACE_REVIEWS_SECTION_HEADING: 'Kommentarer från oss',
  // PLACE_REVIEWS_SECTION_CAPTION: 'Senaste',
  // PLACE_OPEN_NOW: 'Ska göras idag'
})

const $place = nn(document.querySelector('#place'))
const $map = nn(document.querySelector('gmp-map'))
const map = $map['innerMap']

map.setMapTypeId('satellite')

globalThis.map = map
globalThis.placeElement = $place

import('./map.js')
// import('./customer-list.js')

// let installPrompt = null;

// window.addEventListener("beforeinstallprompt", (event) => {
//   event.preventDefault();
//   console.log(event);;
//   installPrompt = event;
// });

const sv = map.streetView
globalThis.sv = sv

// https://developers.google.com/maps/documentation/javascript/streetview#StreetViewControls
sv.setOptions({
  linksControl: true,
  panControl: true,
  zoomControl: true,
  addressControl: true,
  fullscreenControl: true,
  motionTrackingControl: false,
  enableCloseButton: true,
  addressControlOptions: {
    position: google.maps.ControlPosition.BOTTOM_CENTER,
  },
})


// map.setOptions({
//   mapTypeControl: false,
//   clickableIcons: false,
// });

globalThis.$place = $place

google.maps.places.AutocompleteService.prototype.getPredictions = console.log

const placeList = document.querySelector("gmp-place-list");
const searchButton = document.querySelector(".search-button");
const placeDetails = document.querySelector("gmp-place-details");
const input = document.querySelector(".query-input");

globalThis.placeList = placeList
// placeList.configureFromSearchByTextRequest({
//   textQuery: 'vårby allé 53',
//   locationBias: map.getBounds()
// }).then(addMarkers);

placeList.addEventListener("gmp-placeselect", ({ place }) => {
    console.log(place)
});

const markers = {}

const options = {
  componentRestrictions: { country: "sv" },
  fields: ["address_components", "geometry", "icon", "name"],
  strictBounds: false,
}

const autocomplete = new google.maps.places.Autocomplete(input, options);
autocomplete.bindTo("bounds", map);
globalThis.autocomplete = autocomplete

const { AdvancedMarkerElement } = google.maps.marker
const { LatLngBounds } = google.maps

// Helper function to add markers.
async function addMarkers() {
  const bounds = new LatLngBounds();
  placeList.places.forEach((place) => {
      let marker = new AdvancedMarkerElement({
          map: map,
          position: place.location
      });
      marker.metadata = { id: place.id };
      markers[place.id] = marker;
      bounds.extend(place.location);
      marker.addListener('click', (event) => {
          if (infoWindow.isOpen) {
              infoWindow.close();
          }
          placeDetails.configureFromPlace(place);
          placeDetails.style.width = '350px';
          infoWindow.setOptions({ content: placeDetails });
          infoWindow.open({
              anchor: marker,
              map: map.innerMap
          });
          placeDetails.addEventListener('gmp-load', () => {
              map.fitBounds(
                  place.viewport, {
                      top: placeDetails.offsetHeight || 206,
                      left: 200
                  });
          });
      });
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
  });
}

export {
  components,
  $map,
  maps,
  map,
  $place,
}
