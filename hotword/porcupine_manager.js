const porcupineWorkerScript = import.meta.resolve('./workers/porcupine_worker.js')
const downsamplingScript = import.meta.resolve('./workers/downsampling_worker.js')


function PorcupineManager(webVoiceProcessor, bufferSize, microphone) {
  /** @type {Worker} */
  let porcupineWorker;

  function start(
    keywordIDs,
    sensitivities,
    volume,
    detectionCallback,
    errorCallback,
    audioProcessCallback,
    audioContextCallback
  ) {
    porcupineWorker = new Worker(porcupineWorkerScript, {
      type: 'module',
      name: 'porcupine'
    })

    porcupineWorker.postMessage({
      command: "init",
      keywordIDs,
      sensitivities
    });

    porcupineWorker.onmessage = function (evt) {
      const data = evt.data;
      detectionCallback(data.keyword, data.inputFrame, data.inputFrameFloat)
    };

    webVoiceProcessor.start(
      [this],
      volume,
      downsamplingScript,
      errorCallback,
      audioProcessCallback,
      audioContextCallback,
      bufferSize,
      microphone
    )
  }

  function stop () {
    webVoiceProcessor.stop()
    porcupineWorker.postMessage({ command: 'release' })
  }

  function processFrame(inputFrame, inputFrameFloat) {
    porcupineWorker.postMessage({
      command: 'process',
      inputFrame,
      inputFrameFloat
    })
  }

  return {
    start,
    processFrame,
    stop
  }
}

export {
  PorcupineManager
}