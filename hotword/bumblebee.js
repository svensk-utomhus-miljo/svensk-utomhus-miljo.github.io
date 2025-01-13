import { PorcupineManager } from './porcupine_manager.js'
import { webVoiceProcessor } from './web-voice-processor.js'
import { SpectrumAnalyzer } from './spectrum-analyser.js'
import alexa from './alexa.js'

const defaultHotwrds = {
	alexa,
	// bumblebee: require('../hotwords/bumblebee'),
	// computer: require('../hotwords/computer'),
	// grasshopper: require('../hotwords/grasshopper'),
	// hey_edison: require('../hotwords/hey_edison'),
	// hey_google: require('../hotwords/hey_google'),
	// hey_siri: require('../hotwords/hey_siri'),
	// jarvis: require('../hotwords/jarvis'),
	// ok_google: require('../hotwords/ok_google'),
	// porcupine: require('../hotwords/porcupine'),
	// terminator: require('../hotwords/terminator')
}

class Bumblebee {
	/** @type {string?} */
  hotword = null
  hotwords = {}
	events = {}
	defaultSensitivity = 0.5
	_gain = 1

	webWorkersPath = import.meta.resolve('./workers/')

	constructor() {
		this.setMicVolume(1)
		this.setMuted(false)
		this.setVoiceProcessor(webVoiceProcessor)
		this._detectionCallback = this.detectionCallback.bind(this)
		this._errorCallback = this.errorCallback.bind(this)
		this._audioProcessCallback = this.audioProcessCallback.bind(this)
		this._audioAnalyserCallback = this.audioAnalyserCallback.bind(this)
	}

	setVoiceProcessor (proc) {
		this.webVoiceProcessor = proc;
	}

	addHotword (name, data, sensitivity = this.defaultSensitivity) {
		if (!data) {
			if (name in defaultHotwrds) {
				data = defaultHotwrds[name];
			}
		}
		if (data) {
			this.hotwords[name] = {
				data,
				sensitivity
			};
		}
		else {
			throw new Error('no hotword data for ' + name)
		}
	}

	/** @param {'alexa'|''|null} w */
	setHotword (w) {
		if (w === null || w === '') {
			this.hotword = null;
		}
		else if (Object.keys(this.hotwords).indexOf(w) > -1) {
			this.hotword = w;
		}
		else {
			throw new Error('invalid hotword');
		}
	}

	setSensitivity (s) {
		this.defaultSensitivity = s;
	}

	stop () {
		this.porcupineManager?.stop()
		this.started = false
	}

	detectionCallback (keyword, intData, floatData) {
		this.didStart = true
		let hotword
		if (keyword) {
			hotword = keyword
			if (this.hotword === null || keyword === this.hotword) {
				this.events.onHotword?.(keyword);
			}
			else {
				console.log('wrong hotword:', keyword);
			}
		}
		this.events.onData?.(intData, floatData, 16000, hotword);
	}

	errorCallback(e) {
		this.events.onError?.(e)
	}

	audioProcessCallback() {
		// this.didStart = true;
		// this.events.onDdata?.(data, sampleRate);
		// clearTimeout(this.crashTimer);
		// this.crashTimer = setTimeout(() => {
		// 	if (this.started) {
		// 		// one second of no audio has gone by, assume a crash has occurred
		// 		console.log('bumblebee crashed? -----------------');
		// 		this.stop();
		// 		this.start();
		// 	}
		// },1000);
	}

	audioAnalyserCallback (audioAnalyser, gainNode) {
		this.gainNode = gainNode
		this.audioAnalyser = audioAnalyser
		this.events.onAnalyser?.(audioAnalyser)
	}

	start() {
		if (this.started) return;
		this.started = true;
		this.didStart = false;
		this.porcupineManager = PorcupineManager(
			this.webVoiceProcessor,
			this.bufferSize,
			this.microphone
		)

		let keywordIDs = {};
		let sensitivities = [];
		for (let id in this.hotwords) {
			let h = this.hotwords[id];
			keywordIDs[id] = h.data;
			sensitivities.push(h.sensitivity);
		}

		this.porcupineManager.start(
			keywordIDs,
			new Float32Array(sensitivities),
			this._gain,
			this._detectionCallback,
			this._errorCallback,
			this._audioProcessCallback,
			this._audioAnalyserCallback
		)

		// this.crashTimer2 = setTimeout(() => {
		// 	// if it does not start within 1 second, try again
		// 	if (!this.didStart) {
		// 		this.stop();
		// 		this.start();
		// 	}
		// },1000);
	}

	setMuted (muted) {
		this.muted = muted;
		if (this.gainNode) {
			if (muted) {
				this._gain = this.gainNode.gain.value;
				this.gainNode.gain.value = 0;
			}
			else {
				this.gainNode.gain.value = this._gain || 1;
			}
		}
	}

	setMicVolume (vol) {
		this._gain = vol;
		if (this.gainNode) {
			this.gainNode.gain.value = vol;
		}
	}

	setMicrophone(id) {
		this.microphone = id;
	}

	async getMicrophones () {
		const deviceInfos = await navigator.mediaDevices.enumerateDevices();
		const mics = [];
		for (let i = 0; i !== deviceInfos.length; ++i) {
			const deviceInfo = deviceInfos[i];
			if (deviceInfo.kind === 'audioinput') {
				let id = deviceInfo.deviceId;
				let name = deviceInfo.label || 'microphone '+i;
				mics.push({
					id,
					name
				});
			}
		}
		return mics;
	}
}

export {
  Bumblebee,
  SpectrumAnalyzer
}