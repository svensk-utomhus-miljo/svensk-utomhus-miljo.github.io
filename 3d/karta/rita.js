
const drawingManager = new globalThis.google.maps.drawing.DrawingManager({
  drawingControl: false,
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