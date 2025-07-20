// Debug object for inspecting in the console.
var debug: { [key: string]: any } = {};

class Grid {
  isPlaying: boolean;
  noteQ: NoteQueue;

  meter: number;
  subdivision: number;
  measures: number;
  tempo: number;

  canvasTotalTime: number;
  canvasStartTime: number;

  showIndicator: boolean;

  cv: HTMLCanvasElement;
  indicatorE: HTMLCanvasElement;
  staticGridE: HTMLCanvasElement;
  gridCtx: CanvasRenderingContext2D;
  indicatorCtx: CanvasRenderingContext2D;
  staticCtx: CanvasRenderingContext2D;

  cvWidth: number;
  cvHeight: number;

  constructor(noteQueue: NoteQueue) {
    this.isPlaying = false;
    this.noteQ = noteQueue;

    this.meter = 4;
    this.subdivision = 8;
    this.measures = 2;

    this.tempo;
    this.canvasTotalTime;

    this.showIndicator = true;

    document.getElementById("main").style.backgroundColor = appConfig.style.background;

    this.cv = document.getElementById("grid") as HTMLCanvasElement;
    if (!this.cv.getContext) {
      alert("Your browser does not support <canvas>");
    }
    this.indicatorE = document.getElementById("indicator") as HTMLCanvasElement;
    this.staticGridE = document.getElementById("staticGrid") as HTMLCanvasElement;

    this.gridCtx = this.cv.getContext("2d");
    this.gridCtx.fillStyle = appConfig.style.note.defaultColor;
    this.indicatorCtx = this.indicatorE.getContext("2d");
    this.staticCtx = this.staticGridE.getContext("2d");

    this.cvWidth;
    this.cvHeight;
    this.calculateCanvasStartEndTime(true);
    this.resize();
  }

  get canvasEndTime() {
    return this.canvasStartTime + this.canvasTotalTime;
  }

  indicatorOff() {
    this.showIndicator = false;
  }

  indicatorOn() {
    this.showIndicator = true;
  }

  start() {
    console.log("Grid starting");
    this.isPlaying = true;
    this.canvasStartTime = performance.now();
    this.calculateCanvasStartEndTime(true);
    this.animate(this.canvasStartTime);
  }

  stop() {
    console.log("Grid stopping");
    this.isPlaying = false;
  }

  setTempo(tempo: number): Grid {
    console.log(`Grid setting tempo to ${tempo}`);
    this.tempo = tempo;
    this.calculateCanvasTotalTime();
    return this;
  }

  setMeasures(measures: number): Grid {
    this.measures = measures;
    this.calculateCanvasTotalTime();
    this.drawStatic();
    return this;
  }

  setMeter(meter: number): Grid {
    this.meter = meter;
    this.calculateCanvasTotalTime();
    this.drawStatic();
    return this;
  }

  setSubdivision(subdivision: number): Grid {
    this.subdivision = subdivision;
    this.drawStatic();
    return this;
  }

  sync() {
    this.calculateCanvasStartEndTime(true);
  }

  drawStatic() {
    // Background
    this.staticCtx.fillStyle = appConfig.style.background;
    this.staticCtx.fillRect(0, 0, this.cvWidth, this.cvHeight);

    // Draw lanes background
    const lanesCount = Utils.getLanesCount();
    console.log(`Max ${lanesCount} lanes`);
    const laneHeight = appConfig.style.lane.height;

    this.staticCtx.save();
    this.staticCtx.translate(0, appConfig.style.grid.paddingTop);
    for (let i = 0; i < lanesCount; i++) {
      if (i % 2 === 0) {
        this.staticCtx.fillStyle = appConfig.style.lane.evenLaneBackground;
      } else {
        this.staticCtx.fillStyle = appConfig.style.lane.oddLaneBackground;
      }
      this.staticCtx.fillRect(0, 0, this.cvWidth, laneHeight);
      this.staticCtx.translate(0, laneHeight);
    }
    this.staticCtx.restore();

    // Draw vertical subdivision indicators
    const subCount = this.measures * this.subdivision;
    const subWidth = this.cvWidth / (subCount);
    for (let i = 0; i < subCount; i++) {
      var x = i * subWidth;
      this.staticCtx.lineWidth = appConfig.style.grid.subdivision.width;
      this.staticCtx.strokeStyle = appConfig.style.grid.subdivision.color;
      if (i % (this.subdivision / this.meter) === 0) {
        // Beat
        this.staticCtx.lineWidth = appConfig.style.grid.beat.width;
        this.staticCtx.strokeStyle = appConfig.style.grid.beat.color;
      }
      if (i % this.subdivision === 0) {
        // Measure
        this.staticCtx.lineWidth = appConfig.style.grid.measure.width;
        this.staticCtx.strokeStyle = appConfig.style.grid.measure.color;
        x += appConfig.style.grid.measure.width / 2;
      }
      this.staticCtx.beginPath();
      this.staticCtx.moveTo(x, 0);
      this.staticCtx.lineTo(x, this.cvHeight);
      this.staticCtx.stroke();
    }
  }

  animate(currentTime: DOMHighResTimeStamp) {
    // currentTime: DOMHighResTimeStamp in ms
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters
    this.calculateCanvasStartEndTime();

    if (this.showIndicator) {
      this.drawIndicator(currentTime);
    }

    this.drawNotes(currentTime);

    if (this.isPlaying) {
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  drawNotes(currentTime: DOMHighResTimeStamp) {
    // TODO: Maybe optimize by checking if there are notes to hide first.
    this.gridCtx.clearRect(0, 0, this.cvWidth, this.cvHeight);

    this.noteQ.removeNotesBeforeTime(currentTime - this.canvasTotalTime);
    this.noteQ.notes.forEach(note => this.renderNote(note, currentTime));
  }

  renderNote(note: Note, currentTime: DOMHighResTimeStamp) {
    // Render
    const endY = note.bottomY;
    const noteHeight = appConfig.style.note.minHeight +
      note.midiNote.attack * (appConfig.style.note.maxHeight - appConfig.style.note.minHeight);
    const startY = endY - noteHeight;
    this.gridCtx.fillStyle = note.color;

    if (note.startTime >= this.canvasStartTime) {
      // Note is in between canvas start & indicator
      this.renderNoteTime(
        note.startTime,
        Math.min(note.endTime, currentTime),
        startY,
        endY);
        return;
    } else if (note.startTime < this.canvasStartTime && note.endTime <= this.canvasStartTime) {
      // Note is in between indicator & canvas end. Simplify by adding
      // canvasTotal time to the note, rendering like it is in the future.
      this.renderNoteTime(
        Math.max(note.startTime + this.canvasTotalTime, currentTime),
        note.endTime + this.canvasTotalTime,
        startY,
        endY);
    } else if (note.startTime < this.canvasStartTime && note.endTime > this.canvasStartTime) {
      // Note is split in between
      this.renderNoteTime(
        Math.max(note.startTime + this.canvasTotalTime, currentTime),
        this.canvasEndTime,
        startY,
        endY);
      this.renderNoteTime(
        this.canvasStartTime,
        currentTime < note.endTime ? Math.max(note.endTime, currentTime) : Math.min(note.endTime, currentTime),
        startY,
        endY);
    } else {
      throw new Error(`Unhandled case: note(${note.startTime}, ${note.endTime}) and canvas ${this.canvasStartTime}`);
    }
  }

  // Draw rectangles by converting start & end time against canvas start time.
  renderNoteTime(startTime: number, endTime: number, startY: number, endY: number) {
    const startX = (startTime - this.canvasStartTime) / this.canvasTotalTime * this.cvWidth;
    const endX = (endTime - this.canvasStartTime) / this.canvasTotalTime * this.cvWidth;
    const width = endX - startX;
    const height = endY - startY;
    this.gridCtx.beginPath();
    this.gridCtx.roundRect(startX, startY, width, height, [3]);
    this.gridCtx.fill();
    this.gridCtx.strokeStyle = "#333";
    this.gridCtx.lineWidth = 1.5;
    this.gridCtx.strokeRect(startX, startY, width, height);
  }

  drawIndicator(currentTime) {
    this.indicatorCtx.clearRect(0, 0, this.cvWidth, this.cvHeight);
    const x = (currentTime - this.canvasStartTime) / this.canvasTotalTime * this.cvWidth;
    this.indicatorCtx.lineWidth = appConfig.style.grid.indicator.width;
    this.indicatorCtx.strokeStyle = appConfig.style.grid.indicator.color;
    this.indicatorCtx.beginPath();
    this.indicatorCtx.moveTo(x, 0);
    this.indicatorCtx.lineTo(x, this.cvHeight);
    this.indicatorCtx.stroke();
  }

  calculateCanvasStartEndTime(init: boolean = false) {
    if (init) {
      this.canvasStartTime = performance.now();
      return;
    }
    if (performance.now() >= this.canvasEndTime) {
      const times = Math.floor((performance.now() - this.canvasEndTime) / this.canvasTotalTime);
      this.canvasStartTime = this.canvasStartTime + (times + 1) * this.canvasTotalTime;
    }
  }

  calculateCanvasTotalTime() {
    const msPerBeat = 60 * 1000 / this.tempo;
    this.canvasTotalTime = msPerBeat * this.measures * this.meter; // diff between start and end
  }

  resize() {
    this.cvWidth = window.innerWidth * 0.8;
    this.cvHeight = window.innerHeight - 140;

    console.log(`Resize canvas ${this.cvWidth} x ${this.cvHeight}`);
    this.staticGridE.width = this.cvWidth;
    this.staticGridE.height = this.cvHeight;
    this.cv.width = this.cvWidth;
    this.cv.height = this.cvHeight;
    this.indicatorE.width = this.cvWidth;
    this.indicatorE.height = this.cvHeight;

    this.drawStatic();
    this.drawNotes();
  }
}

class App {
  grid: Grid;
  noteQ: NoteQueue;
  inputs?: WebMidi.MIDIInput[];
  input?: WebMidi.MIDIInput;
  selectedChannel: number; // 0 means all
  metronome: Metronome;
  isPlaying: boolean;
  noteLength: number; // 1/16 by default
  uiDeviceSelectE: HTMLSelectElement;
  uiChannelSelectE: HTMLSelectElement;
  uiTempoE: HTMLInputElement;
  metronomeSubE: HTMLSelectElement;
  gridMeasuresE: HTMLSelectElement;
  gridMeterE: HTMLSelectElement;
  gridSubE: HTMLSelectElement;
  noteLengthE: HTMLSelectElement;
  keyDown: boolean; // Prevent multiple keydown events
  volumeKnob: VolumeCanvas;

  constructor(grid: Grid, noteQueue: NoteQueue, metronome: Metronome) {
    this.grid = grid;
    this.selectedChannel = 0; // 0 means all
    this.noteQ = noteQueue;
    this.metronome = metronome;
    this.isPlaying = false;
    this.noteLength = 1 / 16;

    // UI stuff
    this.uiDeviceSelectE = document.getElementById("deviceSelect") as HTMLSelectElement;
    this.uiChannelSelectE = document.getElementById("channelSelect") as HTMLSelectElement;
    this.uiTempoE = document.getElementById("tempo") as HTMLInputElement;
    this.metronomeSubE = document.getElementById("metronomeSubdivision") as HTMLSelectElement;
    this.gridMeasuresE = document.getElementById("measures") as HTMLSelectElement;
    this.gridMeterE = document.getElementById("meter") as HTMLSelectElement;
    this.gridSubE = document.getElementById("gridSubdivision") as HTMLSelectElement;
    this.noteLengthE = document.getElementById("noteWidth") as HTMLSelectElement;
    this.keyDown = false;

    this.volumeKnob = new VolumeCanvas("volumeKnob");
    this.volumeKnob.onVolumeChange((volume) => {
      this.metronome.setVolume(volume);
    });
    this.registerUiCallbacks();

    // TODO: alert that Safari is not supported.

    console.log(`Setting default tempo ${appConfig.defaultTempo}`);
    this.setTempo(appConfig.defaultTempo);
  }

  onMidiReady = () => {
    // TODO: still render and use the metronome even when no midi device
    // is available.
    console.log("WebMidi ready");
    this.refreshDeviceOptions();
    if (WebMidi.inputs.length >= 1) {
      this.selectDevice(0);
    }

    this.uiDeviceSelectE.onchange = () => {
      const deviceIndex = parseInt(this.uiDeviceSelectE.value);
      this.selectDevice(deviceIndex);
    };
    this.uiChannelSelectE.onchange = () => {
      this.selectedChannel = parseInt(this.uiChannelSelectE.value);
      this.registerMidiHandler();
    };
  };

  refreshDeviceOptions = () => {
    if (!this.isPlaying) {
      console.log("Refreshing MIDI device options");
      if ((WebMidi.inputs?.length || 0) !== (this.inputs?.length || 0)) {
        console.log("Found different number of MIDI inputs, refreshing options");
        this.showDeviceOptions();
        if ((this.inputs?.length || 0) === 0) {
          this.selectDevice(null);
        }
      }
    }
    setTimeout(() => {
      this.refreshDeviceOptions();
    }, 3000);
  }

  showDeviceOptions() {
    console.log(`Found ${WebMidi.inputs.length} MIDI devices`);
    if (WebMidi.inputs.length === 0) {
      if (this.isPlaying) {
        this.toggle();
      }
      this.uiChannelSelectE.innerHTML = '<option value="defaultOption">&lt;Select an Input device&gt;</option>';
      return;
    }
    debug.inputs = WebMidi.inputs;
    this.inputs = WebMidi.inputs;

    // Remove default device option.
    const defaultOptionE = this.uiDeviceSelectE.querySelector(`option[value="defaultOption"]`);
    if (defaultOptionE) {
      defaultOptionE.remove();
    }

    WebMidi.inputs.forEach((input: MIDIInput, index: number) => {
      const optionE = document.createElement("option");
      optionE.value = index.toString();
      optionE.text = input.name;
      this.uiDeviceSelectE.appendChild(optionE);
    });
  }

  selectDevice(index: number | null) {
    if (index === null) {
      this.input = undefined;
      return;
    }
    console.log(`Switching to device ${index}`);
    for (let i = 0; i < this.uiDeviceSelectE.options.length; i++) {
      this.uiDeviceSelectE.options[i].selected = i === index;
    }
    this.input = this.inputs[index];
    this.registerMidiHandler();
  }

  registerMidiHandler() {
    this.inputs.forEach(input => {
      input.removeListener();
    });

    const noteCallback = (e) => {
      // e.note: https://webmidijs.org/api/classes/Note
      console.log(`Note ${e.note.identifier} at timestamp ${e.timestamp}`);
      // Make the note smaller (* 0.8) to reduce overlap.
      const msPerBeat = 60 * 1000 / this.getUiTempo();
      const noteLength = 0.8 * (4 * msPerBeat) * this.noteLength;
      this.noteQ.add(new Note(e.note, e.timestamp, e.timestamp + noteLength));
      // TODO: move this note to config.
      // When F#4 (floor tom rim) is triggered, play/pause.
      if (e.note.identifier === "F#4") {
        this.toggle();
      }
      debug.event = e;
    };
    if (this.selectedChannel === 0) {
      this.input.addListener("noteon", noteCallback);
    } else {
      this.input.addListener("noteon", noteCallback, { channels: [this.selectedChannel] });
    }
  }

  toggle() {
    // Start the metronome and grid in silent/invisible mode, then send a sync
    // signal so they are in sync.
    const playButtonE = document.getElementById("playButton");
    this.metronome.soundOff();
    this.grid.indicatorOff();

    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      playButtonE.textContent = "Stop";
      this.metronome.start();
      this.grid.start();

      // Enable sound and indicator.
      setTimeout(() => {
        this.metronome.soundOn();
      }, 100);
      setTimeout(() => {
        this.sync();
        this.grid.indicatorOn();
      }, 300);
      return;
    }
    playButtonE.textContent = "Play";
    this.metronome.stop();
    this.grid.stop();
  }

  sync() {
    this.grid.sync();
    this.metronome.sync();
    this.noteQ.reset();
  }

  setTempo(tempo: number) {
    this.uiTempoE.value = tempo.toString();
    const currentlyPlaying = this.isPlaying;
    if (currentlyPlaying) {
      this.toggle();
    }
    this.grid.setTempo(tempo);
    this.metronome.setTempo(tempo);
    if (currentlyPlaying) {
      this.toggle();
    }
  }

  changeTempo(amount: number) {
    this.setTempo(this.getUiTempo() + amount);
  }

  getUiTempo(): number {
    return parseInt(this.uiTempoE.value);
  }

  registerUiCallbacks() {
    // Buttons
    document.getElementById("tempoInc1").onclick = () => {
      this.setTempo(this.getUiTempo() + 1);
    };
    document.getElementById("tempoInc5").onclick = () => {
      this.setTempo(this.getUiTempo() + 5);
    };
    document.getElementById("tempoDec1").onclick = () => {
      this.setTempo(this.getUiTempo() - 1);
    };
    document.getElementById("tempoDec5").onclick = () => {
      this.setTempo(this.getUiTempo() - 5);
    };
    document.getElementById("playButton").onclick = () => {
      this.toggle();
    };
    document.getElementById("sync").onclick = () => {
      this.sync();
    };

    this.uiTempoE.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.setTempo(this.getUiTempo());
      }
    });
    this.uiTempoE.addEventListener("click", function () {
      this.select();
    });

    this.gridMeasuresE.onchange = () => {
      this.grid.setMeasures(parseInt(this.gridMeasuresE.value));
    };
    this.gridMeterE.onchange = () => {
      const meter = parseInt(this.gridMeterE.value);
      this.grid.setMeter(meter);
      this.metronome.setMeter(meter);
    };
    this.gridSubE.onchange = () => {
      this.grid.setSubdivision(parseInt(this.gridSubE.value));
    };
    this.noteLengthE.onchange = () => {
      this.noteLength = 1 / parseInt(this.noteLengthE.value);
    };
    this.metronomeSubE.onchange = () => {
      this.metronome.setSubdivision(parseInt(this.metronomeSubE.value));
    };

    window.addEventListener("keydown", (event) => {
      // Handle keydown exactly once, until the key is released.
      // This prevents the key being held down from triggering multiple times.
      if (this.keyDown) {
        return;
      }
      event.preventDefault();
      this.keyDown = true;
      if (event.code === "Space" || event.key === " ") {
        console.log("Space key pressed!");
        this.toggle();
      } else if (event.code === "KeyJ" || event.key === "j") {
        this.changeTempo(-1);
      } else if (event.code === "KeyK" || event.key === "k") {
        this.changeTempo(1);
      } else if (event.code === "KeyH" || event.key === "h") {
        this.changeTempo(-5);
      } else if (event.code === "KeyL" || event.key === "l") {
        this.changeTempo(5);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (this.keyDown) {
        this.keyDown = false;
      }
    });

    window.addEventListener("resize", () => {
      this.grid.resize();
    });

    document.getElementById("showHelp").addEventListener("click", () => {
      document.getElementById("help").style.visibility = "visible";
    });
    document.getElementById("closeHelp").addEventListener("click", () => {
      document.getElementById("help").style.visibility = "hidden";
    });
  }
}

function main() {
  console.log("Running main()");
  const noteQueue = new NoteQueue();
  const grid = new Grid(noteQueue);
  const metronome = new Metronome();
  metronome.init();

  const app = new App(grid, noteQueue, metronome);
  app.registerUiCallbacks();
  app.onMidiReady();
}

window.onload = function () {
  console.log("Initializing app");
  const noteQueue = new NoteQueue();
  const grid = new Grid(noteQueue);
  const metronome = new Metronome();
  metronome.init();

  const app = new App(grid, noteQueue, metronome);
  app.registerUiCallbacks();
  debug.app = app;

  WebMidi
    .enable()
    .then(app.onMidiReady)
    .catch(err => alert(err));
}