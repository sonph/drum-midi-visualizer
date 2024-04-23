// Debug object for inspecting in the console.
var dbg = {};
const d = document;

class Grid {
  constructor(noteQueue) {
    this.isPlaying = false;
    this.noteQ = noteQueue;

    this.meter = 4;
    this.subdivision = 4;
    this.measures = 2;

    this.tempo;
    this.canvasTotalTime;

    this.showIndicator = true;

    document.getElementById("main").style.backgroundColor = appConfig.style.background;

    this.cv = document.getElementById("grid");
    if (!this.cv.getContext) {
      alert("Your browser does not support <canvas>");
    }
    this.indicatorE = document.getElementById("indicator");
    this.staticGridE = document.getElementById("staticGrid");

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

  setTempo(tempo) {
    console.log(`Grid setting tempo to ${tempo}`);
    this.tempo = tempo;
    this.calculateCanvasTotalTime();
  }

  setMeasures(measures) {
    checkNumber(measures);
    this.measures = measures;
    this.calculateCanvasTotalTime();
    this.drawStatic();
  }

  setMeter(meter) {
    checkNumber(meter);
    this.meter = meter;
    this.calculateCanvasTotalTime();
    this.drawStatic();
  }

  setSubdivision(subdivision) {
    checkNumber(subdivision);
    this.subdivision = subdivision;
    this.drawStatic();
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
    const laneHeight = appConfig.style.note.height + 2 * (appConfig.style.note.spacing / 2);
    const laneTopPx = appConfig.style.grid.paddingTop - appConfig.style.note.spacing / 2;
    for (let i = 0; i < lanesCount; i++) {
      if (i % 2 === 0) {
        this.staticCtx.fillStyle = appConfig.style.evenLaneBackground;
      } else {
        this.staticCtx.fillStyle = appConfig.style.oddLaneBackground;
      }
      this.staticCtx.fillRect(0, laneTopPx + i * laneHeight, this.cvWidth, laneHeight);
    }

    // Draw vertical subdivision indicators
    const subCount = this.measures * this.subdivision;
    const subWidth = this.cvWidth / (subCount);
    for (let i = 0; i < subCount; i++) {
      var x =  i * subWidth;
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

  animate(currentTime) {
    // currentTime: DOMHighResTimeStamp in ms
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters
    this.calculateCanvasStartEndTime(false);

    this.indicatorCtx.clearRect(0, 0, this.cvWidth, this.cvHeight);
    if (this.showIndicator) {
      this.drawIndicator(currentTime);
    }

    this.drawNotes(currentTime);

    if (this.isPlaying) {
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  drawNotes(currentTime) {
    // TODO: Maybe optimize by checking if there are notes to hide first.
    this.gridCtx.clearRect(0, 0, this.cvWidth, this.cvHeight);

    this.noteQ.removeNotesBeforeTime(currentTime, this.canvasTotalTime);
    this.noteQ.notes.forEach(note => this.renderNote(note, currentTime));
  }

  renderNote(note, currentTime) {
    // Render
    const noteConfig = new Note(note.note);
    const startY = noteConfig.y;
    const endY = startY + appConfig.style.note.height;
    this.gridCtx.fillStyle = noteConfig.color;

    if (note.startTime >= this.canvasStartTime) {
      // Note is in between canvas start & indicator
      this.renderNoteTime(
        this.gridCtx,
        note.startTime,
        Math.min(note.endTime, currentTime),
        startY,
        endY);
    } else if (note.startTime < this.canvasStartTime && note.endTime <= this.canvasStartTime) {
      // Note is in between indicator & canvas end. Simplify by adding
      // canvasTotal time to the note, rendering like it is in the future.
      this.renderNoteTime(
        this.gridCtx,
        Math.max(note.startTime + this.canvasTotalTime, currentTime),
        note.endTime + this.canvasTotalTime,
        startY,
        endY);
    } else if (note.startTime < this.canvasStartTime && note.endTime > this.canvasStartTime) {
      // Note is split in between
      this.renderNoteTime(
        this.gridCtx,
        Math.max(note.startTime + this.canvasTotalTime, currentTime),
        this.canvasEndTime,
        startY,
        endY);
      this.renderNoteTime(
        this.gridCtx,
        this.canvasStartTime,
        currentTime < note.endTime ? Math.max(note.endTime, currentTime) : Math.min(note.endTime, currentTime),
        startY,
        endY);
    } else {
      throw new Error(`Unhandled case: note(${note.startTime}, ${note.endTime}) and canvas ${this.canvasStartTime}`);
    }
  }

  // Draw rectangles by converting start & end time against canvas start time.
  renderNoteTime(ctx, startTime, endTime, startY, endY) {
    const startX = (startTime - this.canvasStartTime) / this.canvasTotalTime * this.cvWidth;
    const endX = (endTime - this.canvasStartTime) / this.canvasTotalTime * this.cvWidth;
    const width = endX - startX;
    const height = endY - startY;
    ctx.beginPath();
    ctx.roundRect(startX, startY, width, height, [3]);
    ctx.fill();
  }

  drawIndicator(currentTime) {
    const x = (currentTime - this.canvasStartTime) / this.canvasTotalTime * this.cvWidth;
    this.indicatorCtx.lineWidth = appConfig.style.grid.indicator.width;
    this.indicatorCtx.strokeStyle = appConfig.style.grid.indicator.color;
    this.indicatorCtx.beginPath();
    this.indicatorCtx.moveTo(x, 0);
    this.indicatorCtx.lineTo(x, this.cvHeight);
    this.indicatorCtx.stroke();
  }

  calculateCanvasStartEndTime(init) {
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
  constructor(grid, noteQueue, metronome) {
    this.grid = grid;
    this.inputs;
    this.selectedInput;
    this.selectedChannel = 0; // 0 means all
    this.noteQ = noteQueue;
    this.metronome = metronome;
    this.isPlaying = false;
    this.noteLength = 1/16;

    // UI stuff
    this.uiDeviceSelectE = document.getElementById("deviceSelect");
    this.uiChannelSelectE = document.getElementById("channelSelect");
    this.uiTempoE = document.getElementById("tempo");
    this.metronomeSubE = document.getElementById("metronomeSubdivision");
    this.gridMeasuresE = document.getElementById("measures");
    this.gridMeterE = document.getElementById("meter");
    this.gridSubE = document.getElementById("gridSubdivision");
    this.noteLengthE = document.getElementById("noteWidth");
    this.keyDown = false;

    this.volumeKnob = new VolumeCanvas("volumeKnob");
    this.volumeKnob.onVolumeChange((volume) => {
      this.metronome.setVolume(volume);
    });
    this.registerUiCallbacks();

    console.log(`Setting default tempo ${appConfig.defaultTempo}`);
    this.setTempo(appConfig.defaultTempo);
  }

  // Function triggered when WEBMIDI.js is ready
  onMidiReady() {
    console.log("WebMidi ready");
    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
      console.log("No MIDI device detected.");
    } else {
      this.inputs = WebMidi.inputs;
      dbg.input = this.inputs[0];

      console.log(`Found ${WebMidi.inputs.length} MIDI devices`);
      this.inputs.forEach((device, index) => {
        this.appendDeviceOption(index, device.name)
      });

      this.selectDevice(0);

      this.uiDeviceSelectE.onchange = () => {
        const deviceIndex = parseInt(this.uiDeviceSelectE.value);
        this.selectDevice(deviceIndex);
      };
      this.uiChannelSelectE.onchange = () => {
        this.selectedChannel = parseInt(this.uiChannelSelectE.value);
        this.registerMidiHandler();
      };
    }
  }

  appendDeviceOption(value, text) {
    // Remove default device option.
    const defaultOptionE = this.uiDeviceSelectE.querySelector(`option[value="defaultOption"]`);
    if (defaultOptionE) {
      defaultOptionE.remove();
    }

    const optionE = document.createElement("option");
    optionE.value = value;
    optionE.text = text;
    this.uiDeviceSelectE.appendChild(optionE);
  }

  selectDevice(index) {
    console.log(`Switching to device ${index}`);
    checkNumber(index);
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
      const noteName = e.note.name + (e.note.accidental === undefined ? "" : "#");
      console.log(`Note ${noteName} at timestamp ${e.timestamp}`);
      // Make the note smaller (* 0.8) to reduce overlap.
      const msPerBeat = 60 * 1000 / this.getUiTempo();
      const noteLength = 0.8 * (4 * msPerBeat) * this.noteLength;
      this.noteQ.add(e.note, e.timestamp, e.timestamp + noteLength);
      dbg.event = e;
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
    } else {
        playButtonE.textContent = "Play";
      this.metronome.stop();
      this.grid.stop();
    }
  }

  sync() {
    this.grid.sync();
    this.metronome.sync();
    this.noteQ.reset();
  }

  setTempo(tempo) {
    checkNumber(tempo);

    this.uiTempoE.value = tempo;
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

  changeTempo(amount) {
    this.setTempo(this.getUiTempo() + amount);
  }

  getUiTempo() {
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
    document.getElementById("tempoInc10").onclick = () => {
      this.setTempo(this.getUiTempo() + 10);
    };
    document.getElementById("tempoDec1").onclick = () => {
      this.setTempo(this.getUiTempo() - 1);
    };
    document.getElementById("tempoDec5").onclick = () => {
      this.setTempo(this.getUiTempo() - 5);
    };
    document.getElementById("tempoDec10").onclick = () => {
      this.setTempo(this.getUiTempo() - 10);
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
    this.metronomeSubE.onchange= () => {
      this.metronome.setSubdivision(parseInt(this.metronomeSubE.value));
    };

    window.addEventListener("keydown", (event) => {
      // Handle keydown exactly once, until the key is released.
      // This prevents the key being held down from triggering multiple times.
      if (this.keyDown) {
        return;
      }
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
  }
}

function main() {
  console.log("main");
  const noteQueue = new NoteQueue();
  const grid = new Grid(noteQueue);
  const metronome = new Metronome();
  metronome.init();

  const app = new App(grid, noteQueue, metronome);
  app.registerUiCallbacks();
  app.onMidiReady();

}

window.onload = function () {
  WebMidi
    .enable()
    .then(main)
    .catch(err => alert(err));
}