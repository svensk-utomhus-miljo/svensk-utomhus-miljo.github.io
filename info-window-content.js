import { supabase } from './db.js'
import cssModule from 'https://unpkg.com/boltcss@0.8.0/bolt.min.css' with { type: 'css' }
import { nn, html } from './util.js'
import { $map } from './main.js'
import { Poi } from './poi.js'

const { event } = globalThis.google.maps
const { AdvancedMarkerElement } = globalThis.google.maps.marker

class InfoWindowContent extends HTMLElement {
  #ownerInput
  marker

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    const wrapperDiv = document.createElement('div')
    wrapperDiv.style.color = 'black'

    document.body.addEventListener('context-request', console.log)
    document.body.addEventListener('Context-provider', console.log)

    wrapperDiv.append(html`
      <label for="owner">Belongs to Marker ID:</label>
      <input id="owner" type="number" name="owner">

      <div style="white-space: pre;"></div>
      <br>
      <select name="type">
        <option value="type" disabled>Typ</option>
        <option value="polygon">Polygon</option>
        <option value="trash_bin">Soptunna</option>
        <option value="sandbox">Sandlåda</option>
        <option value="gate">Bom/Grind</option>
        <option value="parking">Parkering</option>
        <option value="destination">Destination</option>
        <option value="christmas-tree">Julgran</option>
        <option value="pin">Okänt</option>
        <option value="info">Info</option>
        <option value="recycle">Återvinning</option>
      </select>
      <br>
      <a href="#" onclick=${this.showOnGoogleMaps.bind(this)}>Visa på google maps</a>
    `)

    this.#ownerInput = nn(wrapperDiv.querySelector('#owner'))
    this.div = nn(wrapperDiv.querySelector('div'))
    this.select = nn(wrapperDiv.querySelector('select'))

    this.#ownerInput.addEventListener('change', (evt) => {
      this.poi.meta.owner = evt.target.value
    })

    const addNew = this.select.cloneNode(true)
    this.select.after(addNew)

    addNew.addEventListener('change', (evt) => {
      infoWindow.close()
      const type = addNew.value
      if (type === 'polygon') {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
        globalThis.map.getDiv().addEventListener('overlaycomplete', async (evt) => {
          const overlay = evt.detail
          const paths = overlay.getPath().getArray().map(e => e.toJSON())

          const poi = {
            type,
            images: [],
            name: 'area',
            meta: {
              paths,
              color: "#ff5252",
              owner: this.poi.meta.owner
            },
          }

          const { data } = await supabase
            .from('poi')
            .insert(poi)
            .single()

        }, { once: true })
      } else {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER)
        globalThis.map.getDiv().addEventListener('overlaycomplete', async (evt) => {
          const overlay = evt.detail
          var { altitude, ...position } = overlay.position.toJSON()
          const poi = {
            type,
            images: [],
            name: 'marker',
            meta: { position, owner: this.poi.meta.owner },
          }

          const { data } = await supabase
            .from('poi')
            .insert(poi)
            .single()

        }, { once: true })
      }
    })

    // shadow.adoptedStyleSheets = [cssModule];
    shadow.append(wrapperDiv)
  }

  showOnGoogleMaps() {
    const url = `https://www.google.com/maps/search/?api=1&query=${this.poi.meta.position.lat},${this.poi.meta.position.lng}`
    window.open(url, '_blank')
  }

  set poi (_poi) {
    const marker = globalThis.marker
    const poi = marker.data
    this.marker = marker
    this.#ownerInput.value = poi.meta.owner || ''
    this.div.innerText = (poi.id ? `Marker ID: ${poi.id}` : 'Ny punkt') + '\n'
    this.select.value = poi.type
  }

  get poi () {
    return this.marker.data
  }
}

customElements.define('info-window-content', InfoWindowContent)

function upgradeMarkerToAdvance (overlay) {
  const marker = new AdvancedMarkerElement({
    position: overlay.getPosition(),
    map,
    gmpClickable: true,
  })

  overlay.setMap(null)
  return marker
}

function onceEvent (target, eventType) {
  const deferred = Promise.withResolvers()
  event.addListenerOnce(target, eventType, deferred.resolve)
  return deferred.promise
}

globalThis.wis = {
  async deleteMarker () {
    const id = globalThis.marker.data.id
    await supabase.from('poi').delete().eq('id', id)
    globalThis.marker.setMap(null)
    globalThis.infoWindow.close()
  },
  async makeDraggable () {
    const marker = globalThis.marker
    marker.gmpDraggable = !(marker.gmpClickable = false)
    const evt = await onceEvent(marker, 'dragend')
    marker.data.meta.position = evt.latLng.toJSON()
    marker.gmpDraggable = !(marker.gmpClickable = true)
  },

  async addPolygon () {
    const ownerPoi = globalThis.marker.data
    drawingManager.setDrawingMode('polygon')
    const evt = await onceEvent(drawingManager, 'overlaycomplete')
    drawingManager.setDrawingMode(null)
    const polygon = evt.overlay

    const result = await supabase.from('poi').insert({
      name: 'area',
      description: '',
      type: 'polygon',
      meta: {
        paths: polygon.getPath().getArray().map(e => e.toJSON()),
        color: '#ff5252',
        owner: ownerPoi.id,
      }
    }).select()

    polygon.data = Poi(result.data[0])
  },
  async addMarker (type) {
    const ownerPoi = globalThis.marker.data
    drawingManager.setDrawingMode('marker')
    const evt = await onceEvent(drawingManager, 'overlaycomplete')
    drawingManager.setDrawingMode(null)
    const marker = upgradeMarkerToAdvance(evt.overlay)

    const result = await supabase.from('poi').insert({
      name: type,
      description: '',
      type,
      meta: {
        position: marker.position.toJSON(),
        owner: ownerPoi.id,
      }
    }).select()

    marker.data = Poi(result.data[0])
    observer.observe(marker)
  }
}