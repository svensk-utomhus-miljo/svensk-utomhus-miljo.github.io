
const drawingManager = new globalThis.google.maps.drawing.DrawingManager({
  drawingControl: true,
  polygonOptions: {
    fillColor: "#FF5252",
    fillOpacity: 0.3,
    strokeColor: "#FF0000",
    strokeWeight: 3,
    clickable: true,
    editable: false,
    zIndex: 1,
  },
  circleOptions: {
    fillColor: "#ffff00",
    fillOpacity: 1,
    strokeWeight: 5,
    clickable: true,
    editable: false,
    zIndex: 1,
  },
  map: globalThis.map,
})

globalThis.drawingManager = drawingManager
// globalThis.drawingManager.setDrawingMode('circle')

google.maps.event.addListener(drawingManager, 'overlaycomplete', overlay => {
  // replace legacy marker with advanced marker element

  if (overlay.type === 'marker') {
    const marker = new globalThis.google.maps.marker.AdvancedMarkerElement({
      position: overlay.overlay.getPosition(),
      map: globalThis.map,
      gmpClickable: true,
    })

    marker.data = {
      name: 'Marker',
      description: 'This is a marker',
      meta: {
        position: overlay.overlay.getPosition(),
      }
    }

    overlay.overlay.setMap(null)
    overlay.overlay = marker
  }

  const evt = new CustomEvent('overlaycomplete', {
    detail: overlay.overlay,
    bubbles: true,
    cancelable: true,
    composed: true,
  })

  globalThis.map.getDiv().dispatchEvent(evt)
})
