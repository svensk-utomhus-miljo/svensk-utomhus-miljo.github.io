import { Bumblebee } from './hotword/bumblebee.js'

const bumblebee = new Bumblebee()
const audio = new Audio()
const recognition = new webkitSpeechRecognition()
globalThis.recognition = recognition
audio.src = import.meta.resolve('./hotword/hey_google.mp3')
audio.preload = 'metadata'

console.log(recognition.lang)
recognition.lang = 'sv-SE, en-US'
console.log(recognition.lang)
recognition.onresult = function (evt) {
  console.log(evt)
  const transcript = evt.results[0][0].transcript
  console.log('You said: ', transcript)
  bumblebee.setMuted(false)
}

recognition.onend = function () {
  console.log('ended')
  // recognition.start()
}

// recognition.onsoundend = console.log
// recognition.onnomatch = console.log
// recognition.onerror = console.log
// recognition.onaudiostart = console.log
// recognition.onaudioend = console.log
// recognition.onsoundstart = console.log
// recognition.onspeechend = console.log
// recognition.onspeechstart = console.log
// recognition.onstart = console.log

// console.log(recognition)

audio.onended = () => {
  recognition.start()
}

bumblebee.events.onHotword = () => {
  console.log('Hotword detected')
  audio.play()
  bumblebee.setMuted(true)
}

bumblebee.setSensitivity(0.5)
bumblebee.addHotword('alexa')
bumblebee.setHotword('alexa')

bumblebee.events.onError = console.error
bumblebee.events.onDara = console.log

bumblebee.start()
// bumblebee.stop()

const ai = ''

export {
  ai
}