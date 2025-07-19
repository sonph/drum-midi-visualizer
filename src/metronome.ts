class Metronome {
  audioContext: AudioContext | null;
  isPlaying: boolean;
  startTime: number;
  currentTwelveletNote: number;
  tempo: number;
  meter: number;
  masterVolume: number;
  previousMasterVolume: number;
  accentVolume: number;
  quarterVolume: number;
  eighthVolume: number;
  sixteenthVolume: number;
  tripletVolume: number;
  lookahead: number; // How frequently to call the metronome
  scheduleAheadTime: number; // How far ahead to schedule the next note
  nextNoteTime: number; // The next time a note should be played
  metronomeNoteLength: number; // Length of each metronome note
  notesInQueue: { note: number; time: number }[];
  timerWorker: Worker | null;

  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.startTime = 0.0;
    this.currentTwelveletNote = 0;
    this.tempo = 90;
    this.meter = 4;
    this.masterVolume = 0.5;
    this.previousMasterVolume = 0.5;
    this.accentVolume = 1;
    this.quarterVolume = 0.75;
    this.eighthVolume = 0;
    this.sixteenthVolume = 0;
    this.tripletVolume = 0;
    this.lookahead = 25.0;
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = 0.0;
    this.metronomeNoteLength = 0.05;
    this.notesInQueue = [];
    this.timerWorker = null;
  }

  maxBeats() {
    return this.meter * 12;
  }

  nextTwelvelet() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.08333 * secondsPerBeat;
    this.currentTwelveletNote++;
    if (this.currentTwelveletNote === this.maxBeats()) {
      this.currentTwelveletNote = 0;
    }
  }

  calcVolume(beatVolume) {
    return beatVolume * this.masterVolume;
  }

  scheduleNote(beatNumber, time) {
    this.notesInQueue.push({ note: beatNumber, time: time });

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (beatNumber % this.maxBeats() === 0) {
      if (this.accentVolume > 0.25) {
        osc.frequency.value = 880.0;
        gainNode.gain.value = this.calcVolume(this.accentVolume);
      } else {
        osc.frequency.value = 440.0;
        gainNode.gain.value = this.calcVolume(this.quarterVolume);
      }
    } else if (beatNumber % 12 === 0) {
      osc.frequency.value = 440.0;
      gainNode.gain.value = this.calcVolume(this.quarterVolume);
    } else if (beatNumber % 6 === 0) {
      osc.frequency.value = 440.0;
      gainNode.gain.value = this.calcVolume(this.eighthVolume);
    } else if (beatNumber % 4 === 0) {
      osc.frequency.value = 300.0;
      gainNode.gain.value = this.calcVolume(this.tripletVolume);
    } else if (beatNumber % 3 === 0) {
      osc.frequency.value = 220.0;
      gainNode.gain.value = this.calcVolume(this.sixteenthVolume);
    } else {
      gainNode.gain.value = 0;
    }

    osc.start(time);
    osc.stop(time + this.metronomeNoteLength);
  }

  scheduler() {
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentTwelveletNote, this.nextNoteTime);
      this.nextTwelvelet();
    }
  }

  sync() {
    this.nextNoteTime = this.audioContext.currentTime;
    this.currentTwelveletNote = 0;
  }

  start() {
    this.isPlaying = true;

    this.currentTwelveletNote = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.timerWorker.postMessage("start");
  }

  stop() {
    this.isPlaying = false;
    this.timerWorker.postMessage("stop");
  }

  setMeter(meter: number) {
    this.meter = meter;
  }

  setSubdivision(sub: number) {
    this.quarterVolume = 0;
    this.eighthVolume = 0;
    this.tripletVolume = 0;
    this.sixteenthVolume = 0;
    if (sub % 4 === 0) {
      this.quarterVolume = 0.75;
    }
    if (sub % 8 === 0) {
      this.eighthVolume = 0.6;
    }
    if (sub % 12 === 0) {
      this.tripletVolume = 0.5;
    }
    if (sub % 16 === 0) {
      this.sixteenthVolume = 0.5;
    }
  }

  setTempo(tempo: number) {
    console.log(`Metronome setting tempo to ${tempo}`);
    this.tempo = tempo;
  }

  setVolume(volume: number) {
    checkState(0 <= volume && volume <= 1.0, `Volume ${volume} must be betwen 0.0 and 1.0`);
    this.masterVolume = volume;
  }

  soundOff() {
    if (this.masterVolume > 0) {
      this.previousMasterVolume = this.masterVolume;
      this.masterVolume = 0;
    }
  }

  soundOn() {
    this.masterVolume = this.previousMasterVolume;
  }

  init() {
    console.log("metronome init");
    this.audioContext = new AudioContext();
    this.timerWorker = new Worker("worker.js");

    this.timerWorker.onmessage = (e) => {
      if (e.data === "tick") {
        this.scheduler();
      } else {
        console.log("message: " + e.data);
      }
    };

    this.timerWorker.postMessage({ "interval": this.lookahead });
  }
}