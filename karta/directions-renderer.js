const google = globalThis.google

class DirectionsRenderer {
  #directionsService = new google.maps.DirectionsService()

  constructor (map) {
    this.map = map
  }

  async route (legs) {
    const result = await this.#directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      waypoints: chunk,
      optimizeWaypoints: true,
      provideRouteAlternatives: false,
    })
  }

  async foo(stations = getAllCustomers().map(e => e.position)) {
    // Divide route to several parts because max stations limit is 25 (23 waypoints + 1 origin + 1 destination)
    for (var i = 0, parts = [], max = 25 - 1; i < stations.length; i = i + max)
      parts.push(stations.slice(i, i + max + 1));

    const requests = []
    // Send requests to service to get route (for stations count <= 25 only one request will be sent)
    for (const part of parts) {
      const destination = part.pop()
      const origin = part.shift()
      const waypoints = part.map(e => ({ location: e, stopover: true }))

      // Service options
      const service_options = {
          origin,
          destination,
          waypoints,
          travelMode: 'DRIVING',
      };

      // Send request
      const q = this.#directionsService.route(service_options)
      requests.push(q)
    }

    // Wait for response
    const responses = await Promise.all(requests)
    responses.forEach(response => {
      const renderer = new google.maps.DirectionsRenderer()
      renderer.setMap(map)
      renderer.setOptions({ suppressMarkers: true, preserveViewport: true })
      renderer.setDirections(response)
    })
  }
}




export {
  DirectionsRenderer
}