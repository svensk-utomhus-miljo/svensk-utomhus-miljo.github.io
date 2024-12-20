import { supabase } from './db.js'
import cssModule from 'https://unpkg.com/boltcss@0.8.0/bolt.min.css' with { type: 'css' }
import { nn, html } from './util.js'

class InfoWindowContent extends HTMLElement {
  #poi
  #customerDiv

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    const wrapperDiv = document.createElement('div')
    wrapperDiv.style.color = 'black'

    const deleteMarker = () => {
      this.marker.setMap(null)
      globalThis.infoWindow.close()

      if (this.poi.id) {
        supabase
          .from('poi')
          .delete()
          .eq('id', this.poi.id)
          .then(console.log, console.error)
      }
    }

    wrapperDiv.append(html`
      <label for="customer">Kund</label>
      <input id="customer" type="number" name="customer">

      <div style="white-space: pre;"></div>
      <button onclick=${deleteMarker}>Ta bort</button>
      <br>
      <select name="type">
        <option value="type" disabled>Typ</option>
        <option value="customer">Kund</option>
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
      <a href="#" onclick=${save.bind(this)}>Spara</a><br>
      <a href="#" onclick=${this.move.bind(this)}>flytta</a><br>
      <a href="#" onclick=${this.showOnGoogleMaps.bind(this)}>Visa på google maps</a>
    `)

    this.#customerDiv = nn(wrapperDiv.querySelector('#customer'))
    this.div = nn(wrapperDiv.querySelector('div'))
    this.select = nn(wrapperDiv.querySelector('select'))

    async function save (evt) {
      evt.preventDefault()
      this.poi.type = this.select.value
      this.poi.customer = this.#customerDiv.value

      supabase
        .from('poi')
        .upsert(this.poi)
        .then(console.log, console.error)
    }

    const addNew = this.select.cloneNode(true)
    this.select.after(addNew)

    addNew.addEventListener('change', (evt) => {
      infoWindow.close()
      const type = addNew.value
      addNew.selectedIndex = 0
      globalThis.infoWindow.close()
      if (type === 'polygon') {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
        globalThis.map.getDiv().addEventListener('overlaycomplete', async (evt) => {
          const overlay = evt.detail
          const paths = overlay.getPath().getArray().map(e => e.toJSON())

          const poi = {
            type,
            images: [],
            name: 'area',
            meta: { paths, color: "#ff5252" },
            customer: this.#poi.customer
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
          var {altitude, ...position} = overlay.position.toJSON()
          const poi = {
            type,
            images: [],
            name: 'marker',
            meta: { position },
            customer: this.#poi.customer
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

  move () {
    globalThis.infoWindow.close()
    globalThis.map.addEventListener('click', async (evt) => {
      this.marker.setPosition(evt.latLng)
    //   this.poi.coords = { lat: evt.latLng.lat(), lng: evt.latLng.lng() }

    //   supabase
    //     .from('poi')
    //     .upsert(this.poi)
    //     .then(console.log, console.error)
    }, { once: true })
  }

  set poi (poi) {
    this.#customerDiv.value = poi.customer
    this.div.innerText =
      (poi.id ? `Marker ID: ${poi.id}` : 'Ny punkt') + '\n'
    this.#poi = poi
    this.select.value = poi.type
  }

  get poi () {
    return this.#poi
  }

  connectedCallback() {
    console.log("Custom element added to page.");
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
}

customElements.define('info-window-content', InfoWindowContent)