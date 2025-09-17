const datalist = document.createElement('datalist')
const input = document.querySelector('.query-input')
const autocompletes = []
const wm = new WeakMap()

datalist.id = 'results' + Math.random()
input.setAttribute('list', datalist.id)
input.autocomplete = 'on'
input.required = true

// Add an initial request body.
let request = { input: '' }
refreshToken(request)


getAllCustomers().sort(e => {
  return e.data.name
}).forEach(e => {
  const option = document.createElement('option')
  option.value = '👤 ' + e.data.name
  option.label = (e.data.meta.hitta?.id || '') + ''
  wm.set(option, e)
  datalist.appendChild(option)
})

input.form.addEventListener('submit', async (evt) => {
  evt.preventDefault()
  // check if it's a latlng
  const latlng = input.value.split(',').map(e => parseFloat(e))
  if (latlng.length === 2 && latlng.every(e => !isNaN(e))) {
    map.panTo({ lat: latlng[0], lng: latlng[1] })
    return
  }
})

async function makeAcRequest(evt) {
  if (!evt.target.value) return
  console.log(evt.inputType)

  if (evt.inputType === 'insertReplacementText' || !evt.inputType) {
    // If the user is replacing text, we know that he chose a suggestion.
    // We don't need to make a request to the API.

    // Grab the prediction from the WeakMap.
    const placePrediction = wm.get(autocompletes.find(option => option.value === evt.target.value))
    if (!placePrediction) {
      const option = [...datalist.children].find(option => option.value === evt.target.value)
      const customer = wm.get(option)
      map.panTo(customer.position)
      return
    }

    const place = placePrediction.toPlace()
    await place.fetchFields({fields: ['*']})
    globalThis.place = place.toJSON()

    let marker = new google.maps.marker.AdvancedMarkerElement({
      map: map,
      position: place.location
    })
    globalThis.marker = marker

    map.setCenter(place.location)

    // clear the datalist
    autocompletes.forEach(option => option.remove())
    autocompletes.length = 0

    evt.target.value = ''
    return
  }

  // Add the latest char sequence to the request.
  request.input = evt.target.value

  const { suggestions } = await google.maps.places
    .AutocompleteSuggestion.fetchAutocompleteSuggestions(
      request
    )

  // clear the datalist
  autocompletes.forEach(option => option.remove())
  autocompletes.length = 0

  for (const suggestion of suggestions) {
    const placePrediction = suggestion.placePrediction

    // const place = placePrediction.toPlace()
    // place.fetchFields({fields: ['*']}).then(() => {
    //   let marker = new google.maps.marker.AdvancedMarkerElement({
    //     map: map,
    //     position: place.location,
    //     gmpClickable: true,
    //   })
    // })


    // console.log(placePrediction.placeId)
    // update the datalist with the new suggestions
    const option = document.createElement('option')
    option.value = placePrediction.text.toString()
    // option.label = 'placeId: ' + placePrediction.placeId
    autocompletes.push(option)
    wm.set(option, placePrediction)
    datalist.appendChild(option)
    placePrediction.toPlace()

    // a.addEventListener("click", () => {
    //   onPlaceSelected(placePrediction.toPlace())
    // })
    // a.innerText = placePrediction.text.toString()
  }
}

input.oninput = makeAcRequest
input.type = 'search'

// Event handler for clicking on a suggested place.
async function onPlaceSelected(place) {
  let placeText = document.createTextNode(
    place.displayName + ": " + place.formattedAddress,
  )

  input.value = ""
  refreshToken(request)
}

// Helper function to refresh the session token.
async function refreshToken(request) {
  // Create a new session token and add it to the request.
  request.sessionToken = new google.maps.places.AutocompleteSessionToken()
  return request
}

document.body.appendChild(datalist)

// export { }
























/**
 * Kodar en sträng till zero-width tecken baserat på UTF-8
 * @param {string} text - Vanlig text
 * @returns {string} - Zero-width-kodad sträng
 */
function encodeZeroWidth(text) {
  let binaryStr = [...new Uint8Array(new TextEncoder().encode(text))]
    .map(byte => byte.toString(2).padStart(8, '0')) // Konvertera varje byte till 8-bitars binärt
    .join('')

  return binaryStr
    .replace(/0/g, '\u200B') // Zero Width Space för 0
    .replace(/1/g, '\u200C') // Zero Width Non-Joiner för 1
}

/**
 * Avkodar en zero-width sträng tillbaka till vanlig text
 * @param {string} zeroWidthStr - Zero-width-kodad sträng
 * @returns {string} - Avkodad vanlig text
 */
function decodeZeroWidth(zeroWidthStr) {
  let binaryStr = zeroWidthStr
    .replace(/\u200B/g, '0')
    .replace(/\u200C/g, '1')

  let byteArray = binaryStr.match(/.{8}/g) // Dela upp i 8-bitars grupper
    .map(byte => parseInt(byte, 2)) // Konvertera binär till decimalt
    .flat()

  return new TextDecoder().decode(new Uint8Array(byteArray))
}

// Exempel
// let text = "Hej 🌍"
// let encoded = encodeZeroWidth(text)
// console.log(encoded) // Ser tomt ut i console, men innehåller data
// console.log(decodeZeroWidth(encoded)) // "Hej 🌍"
