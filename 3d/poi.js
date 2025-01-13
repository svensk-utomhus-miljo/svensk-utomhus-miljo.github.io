import { supabase } from './db.js'
import { Observable } from 'https://cdn.jsdelivr.net/npm/@gullerya/object-observer@6.1.3/dist/object-observer.min.js'

const clone = obj => JSON.parse(JSON.stringify(obj))

function Poi(poi) {
  // return poi
  const observablePoi = Observable.from(poi)

  Observable.observe(observablePoi, changes => {
    supabase
      .from('poi')
      .upsert(clone(observablePoi))
      .then(console.log, console.error)
  })

  return observablePoi
}

export {
  Poi
}