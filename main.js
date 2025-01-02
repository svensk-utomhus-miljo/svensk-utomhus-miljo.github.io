import './reg-sw.js'
import { nn } from './util.js'

const components = await import('https://unpkg.com/@googlemaps/extended-component-library')

const { setStringLiterals, APILoader } = components
const maps = await APILoader.googleMapsDeferred.promise

await Promise.all([
  maps.importLibrary("marker"),
  maps.importLibrary("drawing"),
  maps.importLibrary("geometry"),
  maps.importLibrary("maps"),
  maps.importLibrary("places"),
])

setStringLiterals({
  PLACE_REVIEWS_SECTION_HEADING: 'Kommentarer från oss',
  PLACE_REVIEWS_SECTION_CAPTION: 'Senaste',
  PLACE_OPEN_NOW: 'Ska göras idag'
})

const placeElement = nn(document.querySelector('#place'))
const map = nn(document.querySelector('gmp-map'))['innerMap']

map.setMapTypeId('satellite')

globalThis.map = map
globalThis.placeElement = placeElement

import('./map.js')
// import('./customer-list.js')

export {
  components,
  maps,
  map,
  placeElement,
}