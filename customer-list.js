import { supabase } from './db.js'
import { myLatLng, currentPosition } from './geo.js'
import cssModule from 'https://unpkg.com/boltcss@0.8.0/bolt.min.css' with { type: 'css' }

const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .order('id')

// globalThis.customers = customers

function createTable (columns, items) {
  const form = document.createElement('form')
  const table = document.createElement('table')
  const tBody = table.createTBody()
  const tFoot = table.createTFoot()

  items.forEach(element => {
    const tr = tBody.insertRow()
    const td = tr.insertCell()
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.name = 'customer'
    checkbox.value = element.id
    td.append(checkbox)

    columns.forEach(key => {
      const td = tr.insertCell()
      td.textContent = element[key]
    })
  })

  const td = tFoot.insertRow().insertCell()
  td.colSpan = columns.length + 1
  const button = document.createElement('button')
  button.textContent = 'Beräkna rutt'
  button.type = 'submit'
  td.append(button)

  form.append(table)
  return form
}

const columns = ['id', 'name', 'address', 'zipcode', 'city', 'bounds' ]
const table = createTable(columns, customers)

table.onsubmit = async (evt) => {
  evt.preventDefault()

  const fd = new FormData(table)
  const ids = fd.getAll('customer')
  const selected = customers.filter(c => ids.includes(c.id.toString()))
  console.log(selected)

  const geocoder = new google.maps.Geocoder()

  await Promise.all(selected.map(async (customer, index) => {
    const address = `${customer.address} ${customer.zipcode || ''} ${customer.city || 'stockholm'}`
    const geo = await geocoder.geocode({ address })
    const geometry = geo.results[0].geometry
    selected[index].geometry = geometry
  }))

  const jobs = selected.map((job, index) => ({
    id: index,
    location: [job.geometry.location.lng(), job.geometry.location.lat()],
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

class CustomerList extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    console.log('Customer list added to page.')
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [cssModule];
    shadow.append(table)
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

customElements.define('customer-list', CustomerList)