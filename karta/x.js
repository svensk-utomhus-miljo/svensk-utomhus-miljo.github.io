

// Load the Google Maps API with Places & Geocoding Libraries

const geocoder = new google.maps.Geocoder()
const infoWindow = new google.maps.InfoWindow()

// Click event to get lat/lng and find places
map.addListener('click', async (event) => {
  const clickedLocation = event.latLng
  console.log('Clicked Location:', clickedLocation.lat(), clickedLocation.lng())

  // Reverse geocode to get any type of location
  const { results } = await geocoder.geocode({
    location: clickedLocation,
    // placeId: '0ahUKEwjGteHUk7mLAxUeExAIHY3dM70Q8BcIAigA'
  })

  console.log(results)
  if (results.length > 0) {
    plotResultsOnMap(map, results, infoWindow)
  }
})


// Function to plot geocoded results on the map
function plotResultsOnMap(map, results, infoWindow) {
  results.forEach((place) => {
    if (!place.geometry) return

    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map: map,
      title: place.formatted_address
    })

    // Info window content
    const content = `
      <strong>${place.formatted_address}</strong><br>
      <small>Lat: ${place.geometry.location.lat()}, Lng: ${place.geometry.location.lng()}</small>
    `
    marker.addListener('click', () => {
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
    })

    // Draw viewport boundary (if available)
    if (place.geometry.viewport) {
      new google.maps.Rectangle({
        bounds: place.geometry.viewport,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0,
        map: map
      })
    }
  })
}