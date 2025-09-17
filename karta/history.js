// Initierar IndexedDB och skapar ett object store för positioner.
const q = Promise.withResolvers()
const request = indexedDB.open('timelineDB', 1)

request.onupgradeneeded = () => {
  const db = request.result

  // Här sparas enbart Float32Array, så vi behöver inget keyPath eller extra indexering
  if (db.objectStoreNames.contains('positions')) return
  db.createObjectStore('positions', {
    autoIncrement: true
  })
}

request.onsuccess = q.resolve
request.onerror = q.reject

await q.promise

// Keep track of the last saved position
let lastSavedPosition = null

// Spara en referens till databasen
const db = request.result

// Komprimeringslogik med Float32Array och DataView
const floatBuffer = new Float32Array(8)

/**
 * Konverterar ett GeolocationPosition-objekt till en binär representation (Uint8Array)
 * @param {GeolocationPosition} position
 */
const toBinary = position => {
  floatBuffer[0] = Math.floor(position.timestamp / 1000)
  floatBuffer[1] = position.coords.accuracy ?? -1
  floatBuffer[2] = position.coords.altitude ?? -1
  floatBuffer[3] = position.coords.altitudeAccuracy ?? -1
  floatBuffer[4] = position.coords.heading ?? -1
  floatBuffer[5] = position.coords.latitude
  floatBuffer[6] = position.coords.longitude
  floatBuffer[7] = position.coords.speed ?? -1
}

/**
 * Tar en binär representation och återställer ett GeolocationPosition-objekt
 * @param {Float32Array} binBuffer
 * @returns {GeolocationPosition}
 */
const fromBinary = binBuffer => {
  floatBuffer.set(binBuffer)

  const location = {
    timestamp: floatBuffer[0] * 1000,
    coords: {
      accuracy: floatBuffer[1],
      altitude: floatBuffer[2],
      altitudeAccuracy: floatBuffer[3],
      heading: floatBuffer[4],
      latitude: floatBuffer[5],
      longitude: floatBuffer[6],
      speed: floatBuffer[7]
    }
  }

  for (const key in location.coords) {
    if (location.coords[key] === -1) location.coords[key] = null
  }

  // @ts-ignore
  return location
}

/**
 * Geo fencing: Returnerar true om två positioner ligger inom samma område (cirkel med radie 50 meter)
 * @param {GeolocationPosition} locationA
 * @param {GeolocationPosition} locationB
 * @param {number} radius
 */
const isApproximatelyWithinBox = (locationA, locationB, radius = 50) => {
  const { latitude: x1, longitude: y1 } = locationA.coords
  const { latitude: x2, longitude: y2 } = locationB.coords
  const R = 63710

  return (
    Math.acos(Math.sin(x1) * Math.sin(x2) + Math.cos(x1) * Math.cos(x2) * Math.cos(y2 - y1)) *
      R <
    radius
  )
}

/**
 * Sparar en position i IndexedDB som en enbart binär Uint8Array
 * @param {GeolocationPosition} position
 */
const save = async (position) => {
  const q = Promise.withResolvers()
  toBinary(position)

  const request = db
    .transaction('positions', 'readwrite')
    .objectStore('positions')
    .add(floatBuffer)

  request.onsuccess = q.resolve
  request.onerror = q.reject

  await q.promise
}

/** @param {GeolocationPosition} position */
const savePosition = async position => {
  if (lastSavedPosition && isApproximatelyWithinBox(lastSavedPosition, position)) return
  save(position)
  lastSavedPosition = position
}

const getHistory = async () => {
  const q = Promise.withResolvers()
  const request = db
    .transaction('positions', 'readonly')
    .objectStore('positions')
    .getAll()

  request.onsuccess = q.resolve
  request.onerror = q.reject

  await q.promise

  return request.result.map(fromBinary)
}

export {
  savePosition,
  getHistory
}


// let sample = [{"timestamp":1739470848000,"coords":{"accuracy":562.6820068359375,"altitude":65.20000457763672,"altitudeAccuracy":null,"heading":null,"latitude":59.23966979980469,"longitude":18.000261306762695,"speed":0}},{"timestamp":1739470976000,"coords":{"accuracy":12.843999862670898,"altitude":64.0999984741211,"altitudeAccuracy":null,"heading":null,"latitude":59.23967742919922,"longitude":18.000268936157227,"speed":null}},{"timestamp":1739471104000,"coords":{"accuracy":600,"altitude":58.70000076293945,"altitudeAccuracy":null,"heading":104.92671966552734,"latitude":59.23952102661133,"longitude":18.001386642456055,"speed":2.419732093811035}},{"timestamp":1739471104000,"coords":{"accuracy":20,"altitude":58.70000076293945,"altitudeAccuracy":null,"heading":284.51043701171875,"latitude":59.23967361450195,"longitude":18.000255584716797,"speed":3.7740073204040527}},{"timestamp":1739471104000,"coords":{"accuracy":600,"altitude":58.70000076293945,"altitudeAccuracy":null,"heading":104.40065002441406,"latitude":59.239524841308594,"longitude":18.00136947631836,"speed":2.4742603302001953}},{"timestamp":1739471232000,"coords":{"accuracy":12.576000213623047,"altitude":66.4000015258789,"altitudeAccuracy":null,"heading":null,"latitude":59.23968505859375,"longitude":18.000255584716797,"speed":null}},{"timestamp":1739512064000,"coords":{"accuracy":19.628000259399414,"altitude":31.80000114440918,"altitudeAccuracy":null,"heading":null,"latitude":59.2529411315918,"longitude":17.878311157226562,"speed":0.09356700628995895}},{"timestamp":1739512448000,"coords":{"accuracy":14.402000427246094,"altitude":31.80000114440918,"altitudeAccuracy":null,"heading":null,"latitude":59.25294876098633,"longitude":17.878271102905273,"speed":0.055458102375268936}},{"timestamp":1739770624000,"coords":{"accuracy":20,"altitude":32.5,"altitudeAccuracy":null,"heading":120.22029113769531,"latitude":59.25291061401367,"longitude":17.87841796875,"speed":0.8241683840751648}},{"timestamp":1739858304000,"coords":{"accuracy":26.79400062561035,"altitude":33.70000076293945,"altitudeAccuracy":null,"heading":281.9844055175781,"latitude":59.24995803833008,"longitude":17.866060256958008,"speed":10.481392860412598}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":314.01385498046875,"latitude":59.25025939941406,"longitude":17.865257263183594,"speed":6.249483585357666}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":280.00567626953125,"latitude":59.25031661987305,"longitude":17.86437225341797,"speed":9.167530059814453}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":290.9990539550781,"latitude":59.25046920776367,"longitude":17.86349105834961,"speed":11.809499740600586}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":292.99774169921875,"latitude":59.25065231323242,"longitude":17.862586975097656,"speed":12.570411682128906}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":293.0000915527344,"latitude":59.250858306884766,"longitude":17.861658096313477,"speed":12.839914321899414}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":294.00152587890625,"latitude":59.251060485839844,"longitude":17.86078453063965,"speed":11.211115837097168}},{"timestamp":1739858304000,"coords":{"accuracy":3.7899999618530273,"altitude":39.5,"altitudeAccuracy":null,"heading":291.99481201171875,"latitude":59.251251220703125,"longitude":17.859935760498047,"speed":7.242184162139893}},{"timestamp":1739858304000,"coords":{"accuracy":8.706000328063965,"altitude":50.69232177734375,"altitudeAccuracy":null,"heading":262.0006408691406,"latitude":59.251564025878906,"longitude":17.859098434448242,"speed":6.869998931884766}},{"timestamp":1739858304000,"coords":{"accuracy":9.9350004196167,"altitude":52.05987548828125,"altitudeAccuracy":null,"heading":299.9994201660156,"latitude":59.25175476074219,"longitude":17.85817527770996,"speed":10.649495124816895}},{"timestamp":1739858304000,"coords":{"accuracy":9.9350004196167,"altitude":53.4332275390625,"altitudeAccuracy":null,"heading":300.9993896484375,"latitude":59.25203323364258,"longitude":17.85725975036621,"speed":13.389815330505371}},{"timestamp":1739858304000,"coords":{"accuracy":9.9350004196167,"altitude":53.4156494140625,"altitudeAccuracy":null,"heading":298.9999084472656,"latitude":59.25230407714844,"longitude":17.856365203857422,"speed":12.420110702514648}},{"timestamp":1739858304000,"coords":{"accuracy":9.9350004196167,"altitude":53.3084716796875,"altitudeAccuracy":null,"heading":290.0010070800781,"latitude":59.25251388549805,"longitude":17.85552215576172,"speed":11.460063934326172}},{"timestamp":1739858304000,"coords":{"accuracy":9.9350004196167,"altitude":52.54730224609375,"altitudeAccuracy":null,"heading":277.0003967285156,"latitude":59.25263214111328,"longitude":17.854598999023438,"speed":9.660720825195312}},{"timestamp":1739858304000,"coords":{"accuracy":9.9350004196167,"altitude":48.13397216796875,"altitudeAccuracy":null,"heading":204.9916229248047,"latitude":59.25131607055664,"longitude":17.85296058654785,"speed":16.0611572265625}},{"timestamp":1739858432000,"coords":{"accuracy":9.9350004196167,"altitude":47.7989501953125,"altitudeAccuracy":null,"heading":226.99258422851562,"latitude":59.250816345214844,"longitude":17.85220718383789,"speed":15.748916625976562}},{"timestamp":1739858432000,"coords":{"accuracy":9.9350004196167,"altitude":46.702392578125,"altitudeAccuracy":null,"heading":231.9999542236328,"latitude":59.250450134277344,"longitude":17.851320266723633,"speed":16.73986053466797}},{"timestamp":1739858432000,"coords":{"accuracy":9.9350004196167,"altitude":46.8302001953125,"altitudeAccuracy":null,"heading":232.0008544921875,"latitude":59.250118255615234,"longitude":17.850486755371094,"speed":17.421852111816406}},{"timestamp":1739858432000,"coords":{"accuracy":9.9350004196167,"altitude":45.69207763671875,"altitudeAccuracy":null,"heading":233.9999237060547,"latitude":59.24967956542969,"longitude":17.8493595123291,"speed":18.199909210205078}},{"timestamp":1739858816000,"coords":{"accuracy":9.9350004196167,"altitude":57.03118896484375,"altitudeAccuracy":null,"heading":273.94573974609375,"latitude":59.2064094543457,"longitude":17.69535255432129,"speed":23.68014907836914}},{"timestamp":1739858816000,"coords":{"accuracy":9.9350004196167,"altitude":59.08599853515625,"altitudeAccuracy":null,"heading":274.9967346191406,"latitude":59.20645523071289,"longitude":17.694334030151367,"speed":23.347299575805664}},{"timestamp":1739858816000,"coords":{"accuracy":9.9350004196167,"altitude":60.71142578125,"altitudeAccuracy":null,"heading":274.9962463378906,"latitude":59.20650863647461,"longitude":17.693328857421875,"speed":22.835107803344727}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":62.193115234375,"altitudeAccuracy":null,"heading":275.0008239746094,"latitude":59.20655822753906,"longitude":17.692359924316406,"speed":22.364093780517578}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.22686767578125,"altitudeAccuracy":null,"heading":274.0013122558594,"latitude":59.20660400390625,"longitude":17.691377639770508,"speed":22.826087951660156}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.4903564453125,"altitudeAccuracy":null,"heading":270.02899169921875,"latitude":59.20662307739258,"longitude":17.690372467041016,"speed":23.13861083984375}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.73876953125,"altitudeAccuracy":null,"heading":266.0015869140625,"latitude":59.20660400390625,"longitude":17.68936538696289,"speed":22.895977020263672}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.6494140625,"altitudeAccuracy":null,"heading":262.0356140136719,"latitude":59.20655059814453,"longitude":17.68837547302246,"speed":22.753267288208008}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.18896484375,"altitudeAccuracy":null,"heading":258.03118896484375,"latitude":59.20646667480469,"longitude":17.687393188476562,"speed":22.620994567871094}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.1021728515625,"altitudeAccuracy":null,"heading":254.144287109375,"latitude":59.206336975097656,"longitude":17.6864070892334,"speed":23.75741195678711}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":63.80084228515625,"altitudeAccuracy":null,"heading":249.25132751464844,"latitude":59.206172943115234,"longitude":17.685392379760742,"speed":24.71261215209961}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":65.28369140625,"altitudeAccuracy":null,"heading":243.6277313232422,"latitude":59.205772399902344,"longitude":17.68368911743164,"speed":23.324935913085938}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":68.137451171875,"altitudeAccuracy":null,"heading":238.7988739013672,"latitude":59.205482482910156,"longitude":17.68273162841797,"speed":21.26429557800293}},{"timestamp":1739858944000,"coords":{"accuracy":9.9350004196167,"altitude":71.5804443359375,"altitudeAccuracy":null,"heading":236.9324188232422,"latitude":59.20518112182617,"longitude":17.68182945251465,"speed":20.11447525024414}},{"timestamp":1739873408000,"coords":{"accuracy":8.770000457763672,"altitude":33.099998474121094,"altitudeAccuracy":null,"heading":324.501220703125,"latitude":59.2531852722168,"longitude":17.876632690429688,"speed":1.2097793817520142}},{"timestamp":1739880704000,"coords":{"accuracy":28.051000595092773,"altitude":78.9000015258789,"altitudeAccuracy":null,"heading":null,"latitude":59.273277282714844,"longitude":18.133615493774414,"speed":null}},{"timestamp":1739884544000,"coords":{"accuracy":24.634000778198242,"altitude":43.29999923706055,"altitudeAccuracy":null,"heading":null,"latitude":59.2489013671875,"longitude":17.879179000854492,"speed":0}},{"timestamp":1740120960000,"coords":{"accuracy":12.512999534606934,"altitude":52.70000076293945,"altitudeAccuracy":null,"heading":113.77934265136719,"latitude":59.26859664916992,"longitude":17.92009162902832,"speed":3.066315174102783}},{"timestamp":1740120960000,"coords":{"accuracy":3.7899999618530273,"altitude":52.70000076293945,"altitudeAccuracy":null,"heading":148.000732421875,"latitude":59.267982482910156,"longitude":17.920650482177734,"speed":3.909703493118286}},{"timestamp":1740120960000,"coords":{"accuracy":3.7899999618530273,"altitude":52.70000076293945,"altitudeAccuracy":null,"heading":74.00262451171875,"latitude":59.26785659790039,"longitude":17.9215087890625,"speed":1.4107115268707275}},{"timestamp":1740120960000,"coords":{"accuracy":24.576000213623047,"altitude":53.89999771118164,"altitudeAccuracy":null,"heading":172.04298400878906,"latitude":59.26776885986328,"longitude":17.92237091064453,"speed":2.173036575317383}},{"timestamp":1740121600000,"coords":{"accuracy":49.40999984741211,"altitude":54.099998474121094,"altitudeAccuracy":null,"heading":null,"latitude":59.26780700683594,"longitude":17.924104690551758,"speed":null}},{"timestamp":1740121600000,"coords":{"accuracy":27.60300064086914,"altitude":54.099998474121094,"altitudeAccuracy":null,"heading":334.4231872558594,"latitude":59.267845153808594,"longitude":17.923181533813477,"speed":1.0992450714111328}},{"timestamp":1740129408000,"coords":{"accuracy":26.139999389648438,"altitude":59.72979736328125,"altitudeAccuracy":null,"heading":116.86376190185547,"latitude":59.246917724609375,"longitude":18.23175621032715,"speed":0.8472363948822021}},{"timestamp":1740129664000,"coords":{"accuracy":6.879000186920166,"altitude":61.099998474121094,"altitudeAccuracy":null,"heading":17.60133934020996,"latitude":59.24769592285156,"longitude":18.23114013671875,"speed":1.2974581718444824}},{"timestamp":1740131200000,"coords":{"accuracy":19.802000045776367,"altitude":60,"altitudeAccuracy":null,"heading":356.6148376464844,"latitude":59.247596740722656,"longitude":18.232528686523438,"speed":0.5632876753807068}},{"timestamp":1740133376000,"coords":{"accuracy":12.720999717712402,"altitude":62,"altitudeAccuracy":null,"heading":299.62750244140625,"latitude":59.2504997253418,"longitude":18.20968246459961,"speed":23.02344512939453}},{"timestamp":1740379904000,"coords":{"accuracy":21.083999633789062,"altitude":68.0999984741211,"altitudeAccuracy":null,"heading":37,"latitude":59.279075622558594,"longitude":17.919294357299805,"speed":19.84000015258789}},{"timestamp":1740379904000,"coords":{"accuracy":9.286999702453613,"altitude":68.0999984741211,"altitudeAccuracy":null,"heading":37.99891662597656,"latitude":59.27946853637695,"longitude":17.920085906982422,"speed":19.21497344970703}},{"timestamp":1740379904000,"coords":{"accuracy":3.7899999618530273,"altitude":68.0999984741211,"altitudeAccuracy":null,"heading":38,"latitude":59.279930114746094,"longitude":17.920791625976562,"speed":18.290000915527344}},{"timestamp":1740379904000,"coords":{"accuracy":3.7899999618530273,"altitude":68.0999984741211,"altitudeAccuracy":null,"heading":41.0001220703125,"latitude":59.280364990234375,"longitude":17.921525955200195,"speed":18.25873565673828}},{"timestamp":1740379904000,"coords":{"accuracy":3.7899999618530273,"altitude":68.0999984741211,"altitudeAccuracy":null,"heading":44.999977111816406,"latitude":59.28078079223633,"longitude":17.92230224609375,"speed":18.39990234375}},{"timestamp":1740379904000,"coords":{"accuracy":3.7899999618530273,"altitude":68.0999984741211,"altitudeAccuracy":null,"heading":48.9995231628418,"latitude":59.28117370605469,"longitude":17.92313003540039,"speed":18.449987411499023}},{"timestamp":1740379904000,"coords":{"accuracy":3.7899999618530273,"altitude":60.20867919921875,"altitudeAccuracy":null,"heading":52.99930953979492,"latitude":59.281551361083984,"longitude":17.924047470092773,"speed":20.429759979248047}},{"timestamp":1740379904000,"coords":{"accuracy":3.7899999618530273,"altitude":59.890625,"altitudeAccuracy":null,"heading":56.000038146972656,"latitude":59.28187561035156,"longitude":17.924942016601562,"speed":20.520116806030273}},{"timestamp":1740387072000,"coords":{"accuracy":49.34600067138672,"altitude":30.900001525878906,"altitudeAccuracy":null,"heading":null,"latitude":59.3144645690918,"longitude":18.006261825561523,"speed":0}},{"timestamp":1740387072000,"coords":{"accuracy":6.708000183105469,"altitude":30.80000114440918,"altitudeAccuracy":null,"heading":102.86109924316406,"latitude":59.31452560424805,"longitude":18.007131576538086,"speed":1.2568984031677246}},{"timestamp":1740388224000,"coords":{"accuracy":82.5,"altitude":30.80000114440918,"altitudeAccuracy":null,"heading":null,"latitude":59.3138427734375,"longitude":18.020980834960938,"speed":null}},{"timestamp":1740388224000,"coords":{"accuracy":16.985000610351562,"altitude":27.600000381469727,"altitudeAccuracy":null,"heading":119.00605010986328,"latitude":59.313209533691406,"longitude":18.02150535583496,"speed":5.491334915161133}},{"timestamp":1740388224000,"coords":{"accuracy":6.611999988555908,"altitude":27.600000381469727,"altitudeAccuracy":null,"heading":110.8570327758789,"latitude":59.31293487548828,"longitude":18.02283477783203,"speed":7.168082237243652}},{"timestamp":1740388224000,"coords":{"accuracy":4.573999881744385,"altitude":28.200000762939453,"altitudeAccuracy":null,"heading":114.9963150024414,"latitude":59.31270980834961,"longitude":18.023643493652344,"speed":7.200448989868164}},{"timestamp":1740388224000,"coords":{"accuracy":3.7899999618530273,"altitude":28.200000762939453,"altitudeAccuracy":null,"heading":118.96717071533203,"latitude":59.3124885559082,"longitude":18.02446746826172,"speed":6.941919803619385}},{"timestamp":1740388224000,"coords":{"accuracy":3.7899999618530273,"altitude":28.200000762939453,"altitudeAccuracy":null,"heading":85.01942443847656,"latitude":59.31242370605469,"longitude":18.025331497192383,"speed":7.884586334228516}},{"timestamp":1740388224000,"coords":{"accuracy":3.7899999618530273,"altitude":28.200000762939453,"altitudeAccuracy":null,"heading":106.98358154296875,"latitude":59.312442779541016,"longitude":18.026229858398438,"speed":7.0513596534729}},{"timestamp":1740388224000,"coords":{"accuracy":3.7899999618530273,"altitude":28.200000762939453,"altitudeAccuracy":null,"heading":121.67153930664062,"latitude":59.31223678588867,"longitude":18.02707862854004,"speed":7.764898777008057}},{"timestamp":1740388224000,"coords":{"accuracy":3.7899999618530273,"altitude":28.200000762939453,"altitudeAccuracy":null,"heading":128.9981231689453,"latitude":59.31190872192383,"longitude":18.02787971496582,"speed":6.203729152679443}},{"timestamp":1740389248000,"coords":{"accuracy":35.013999938964844,"altitude":33.400001525878906,"altitudeAccuracy":null,"heading":8.97027587890625,"latitude":59.25178909301758,"longitude":17.878032684326172,"speed":0.6686499118804932}},{"timestamp":1740389248000,"coords":{"accuracy":24.687999725341797,"altitude":33.400001525878906,"altitudeAccuracy":null,"heading":323.86187744140625,"latitude":59.25186538696289,"longitude":17.877002716064453,"speed":2.1076438426971436}},{"timestamp":1740389248000,"coords":{"accuracy":3.7899999618530273,"altitude":33.400001525878906,"altitudeAccuracy":null,"heading":318,"latitude":59.2525749206543,"longitude":17.87657356262207,"speed":6.450046539306641}},{"timestamp":1740391424000,"coords":{"accuracy":20,"altitude":32.20000076293945,"altitudeAccuracy":null,"heading":null,"latitude":59.25291442871094,"longitude":17.878429412841797,"speed":null}},{"timestamp":1740417024000,"coords":{"accuracy":13.71500015258789,"altitude":58.5,"altitudeAccuracy":null,"heading":null,"latitude":59.239681243896484,"longitude":18.000263214111328,"speed":null}},{"timestamp":1740417280000,"coords":{"accuracy":699.9990234375,"altitude":58.29999923706055,"altitudeAccuracy":null,"heading":null,"latitude":59.241546630859375,"longitude":18.008033752441406,"speed":null}},{"timestamp":1740417280000,"coords":{"accuracy":20,"altitude":58.29999923706055,"altitudeAccuracy":null,"heading":null,"latitude":59.23967742919922,"longitude":18.00025177001953,"speed":null}},{"timestamp":1740417280000,"coords":{"accuracy":699.9990234375,"altitude":58.29999923706055,"altitudeAccuracy":null,"heading":null,"latitude":59.241546630859375,"longitude":18.008033752441406,"speed":null}},{"timestamp":1740417280000,"coords":{"accuracy":699.9990234375,"altitude":58.29999923706055,"altitudeAccuracy":null,"heading":null,"latitude":59.241546630859375,"longitude":18.008033752441406,"speed":0}},{"timestamp":1740417280000,"coords":{"accuracy":20,"altitude":58.29999923706055,"altitudeAccuracy":null,"heading":null,"latitude":59.239681243896484,"longitude":18.00025177001953,"speed":null}}]

// sample.forEach(e => {
//   e.timestamp = new Date(e.timestamp)
//   e.coords.lat = e.coords.latitude
//   e.coords.lng = e.coords.longitude
// })
// // only keep samples for an specific date like 2025-12-31
// sample = sample.filter(e => e.timestamp.toISOString().startsWith('2025-02-24')).slice(0, -6)

// const url = new URL(`https://roads.googleapis.com/v1/snapToRoads?interpolate=true&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`)
// url.searchParams.set('path', sample.map(e => `${e.coords.lat},${e.coords.lng}`).join('|'))

// fetch(url)
//   .then(res => res.json())
//   .then(result => {
//     for (const point of result.snappedPoints) {
//       new google.maps.Marker({
//         position: new google.maps.LatLng(point.location.latitude, point.location.longitude),
//         map
//       })
//     }
//   })
