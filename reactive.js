const adv = Object.getOwnPropertyDescriptors(google.maps.marker.AdvancedMarkerElement.prototype)

// Object.defineProperties(google.maps.marker.AdvancedMarkerElement.prototype, {
//   position: {
//     set (position) {
//       adv.position.set.call(this, position)

//       if (this.data) {
//         this.data.meta.position = position.toJSON()
//       }
//     }
//   }
// })