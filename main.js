// Debug object for inspecting in the console.
var dbg = {};
const d = document;
const animateForever = true;

const maxSyncDelay = 20; // ms

// assuming a 4/4 time, 2 measures = 8 beats.
// 9 lines, beginning + 7 separating lines + end line
const tempo = 90;
const msPerBeat = 60 * 1000 / tempo;
const beatsCount = 8;
const canvasTotalTime = msPerBeat * beatsCount; // diff between start and end
// if 8 beats have passed, the new start time is the previous end time.

// Notes are rendered as a block, not a point.
// TODO: support variable note length with instruments such as a piano.
const noteLength = 100; // ms

function checkState(bool, message) {
  if (!bool) {
    console.log(message);
  }
}

class Grid {
  constructor(noteQueue) {
    this.isPlaying = false;
    this.noteQ = noteQueue;

    this.cv = document.getElementById("grid");
    if (!this.cv.getContext) {
      alert("Canvas is not supported");
    }
    this.ctx = this.cv.getContext("2d");
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "red";
    this.cvWidth = this.cv.width;
    this.cvHeight = this.cv.height;

    this.indicatorCtx = document.getElementById("indicator").getContext("2d");
    this.indicatorCtx.lineWidth = 3;
    this.indicatorCtx.strokeStyle = "blue";

    this.staticCtx = document.getElementById("staticGrid").getContext("2d");
    this.drawStatic();

    this.gridCtx = document.getElementById("grid").getContext("2d");
    this.gridCtx.lineWidth = 4;
    this.gridCtx.strokeStyle = "red";

    this.calculateCanvasStartEndTime(true);
  }

  get canvasEndTime() {
    return this.canvasStartTime + canvasTotalTime;
  }

  start() {
    this.isPlaying = true;
    this.canvasStartTime = performance.now();
    this.calculateCanvasStartEndTime(true);
    this.animate(this.canvasStartTime);
  }

  stop() {
    this.isPlaying = false;
  }

  registerSyncCallback(callback) {
    this.syncCallback = callback;
  }

  sync() {
    this.calculateCanvasStartEndTime(true);
  }

  drawStatic() {
    // draw border
    this.staticCtx.lineWidth = 3;
    this.staticCtx.strokeStyle = "#333";
    this.staticCtx.strokeRect(0, 0, this.cvWidth, this.cvHeight);

    // draw beat indicator
    const pxBetweenBeats = this.cvWidth / beatsCount;
    for (let i = 1; i < beatsCount; i++) {
      const x = i * pxBetweenBeats;
      this.staticCtx.lineWidth = 1;
      this.staticCtx.strokeStyle = "#888";
      if (i % 4 === 0) {
        this.staticCtx.lineWidth = 4;
        this.staticCtx.strokeStyle = "#333";
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
    this.drawIndicator(currentTime);

    this.drawNotes(currentTime);

    // Killswitch
    if (!animateForever && performance.now() >= 10 * 1000) {
      return;
    }
    if (this.isPlaying) {
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  drawNotes(currentTime) {
    // TODO: Maybe optimize by checking if there are notes to hide first.
    this.gridCtx.clearRect(0, 0, this.cvWidth, this.cvHeight);

    this.noteQ.removeNotesBeforeTime(currentTime);
    this.noteQ.notes.forEach(note => this.renderNote(note, currentTime));
  }

  renderNote(note, currentTime) {
    // Render
    const paddingTop = 40;
    const startY = paddingTop + 20 * (note.note.charCodeAt(0) - 65); // "A"
    const endY = startY + 20;

    if (note.startTime >= this.canvasStartTime) {
      // Note is in between canvas start & indicator
      this.strokeRectTime(
        this.gridCtx,
        note.startTime,
        Math.min(note.endTime, currentTime),
        startY,
        endY);
    } else if (note.startTime < this.canvasStartTime && note.endTime <= this.canvasStartTime) {
      // Note is in between indicator & canvas end. Simplify by adding
      // canvasTotal time to the note, rendering like it is in the future.
      this.strokeRectTime(
        this.gridCtx,
        Math.max(note.startTime + canvasTotalTime, currentTime),
        note.endTime + canvasTotalTime,
        startY,
        endY);
    } else if (note.startTime < this.canvasStartTime && note.endTime > this.canvasStartTime) {
      // Note is split in between
      this.strokeRectTime(
        this.gridCtx,
        Math.max(note.startTime + canvasTotalTime, currentTime),
        this.canvasEndTime,
        startY,
        endY);
      this.strokeRectTime(
        this.gridCtx,
        this.canvasStartTime,
        currentTime < note.endTime ? Math.max(note.endTime, currentTime) : Math.min(note.endTime, currentTime),
        startY,
        endY);
    } else {
      console.log(`Unhandled case: note(${note.startTime}, ${note.endTime}) and canvas ${this.canvasStartTime}`);
    }
  }

  // Draw rectangles by converting start & end time against canvas start time.
  strokeRectTime(ctx, startTime, endTime, startY, endY) {
    const startX = (startTime - this.canvasStartTime) / canvasTotalTime * this.cvWidth;
    const endX = (endTime - this.canvasStartTime) / canvasTotalTime * this.cvWidth;
    this.strokeRect(ctx, startX, startY, endX, endY);
  }

  strokeRect(ctx, startX, startY, endX, endY) {
    const width = endX - startX;
    const height = endY - startY;
    ctx.strokeRect(startX, startY, width, height);
  }

  drawIndicator(currentTime) {
    const x = (currentTime - this.canvasStartTime) / canvasTotalTime * this.cvWidth;
    this.indicatorCtx.beginPath();
    this.indicatorCtx.moveTo(x, 0);
    this.indicatorCtx.lineTo(x, this.cvHeight);
    this.indicatorCtx.stroke();
  }

  calculateCanvasStartEndTime(init) {
    if (init) {
      this.canvasStartTime = performance.now();
      // console.log(`Canvas from time ${this.canvasStartTime} to ${this.canvasEndTime}`);
      return;
    }
    if (performance.now() >= this.canvasEndTime) {
      const times = Math.floor((performance.now() - this.canvasEndTime) / canvasTotalTime);
      this.canvasStartTime = this.canvasStartTime + (times + 1) * canvasTotalTime;
      // console.log(`Canvas from time ${this.canvasStartTime} to ${this.canvasEndTime}`);
    }
  }
}

class UI {
  constructor() {
    this.deviceSelectE = document.getElementById("deviceSelect");
    dbg.deviceSelectE = this.deviceSelectE;
  }

  appendDeviceOption(value, text) {
    this.maybeRemoveDefaultOption();
    const optionE = document.createElement("option");
    optionE.value = value;
    optionE.text = text;
    this.deviceSelectE.appendChild(optionE);
  }

  maybeRemoveDefaultOption() {
    const defaultOptionE = this.deviceSelectE.querySelector(`option[value="defaultOption"]`);
    if (defaultOptionE) {
      defaultOptionE.remove();
    }
  }

  selectDevice(index) {
    for (let i = 0; i < this.deviceSelectE.options.length; i++) {
      this.deviceSelectE.options[i].selected = i === index;
    }
  }

  getSelectedDeviceIndex() {
    return this.deviceSelectE.value;
  }

  onChange(callback) {
    this.deviceSelectE.onchange = callback;
  }
}

// TODO: implement a linked list queue.
// For now, since the number of notes is small, a list should be sufficient.
// Notes are sorted in timestamp order. New notes should be appended at the end.
class NoteQueue {
  constructor() {
    this.notesArr = [];
    this.firstAvailableNoteIndex = -1;
  }

  add(note, startTime) {
    if (this.notesArr.length === 0) {
      this.firstAvailableNoteIndex = 0;
    }
    this.notesArr.push({
      note: note,
      startTime: startTime,
      endTime: startTime + noteLength,
      visible: true
    });
  }

  isEmpty() {
    return this.notesArr.length === 0 || this.firstAvailableNoteIndex === -1
      || this.firstAvailableNoteIndex >= this.notesArr.length;
  }

  get notes() {
    // Returning an iterator while the list is copied/truncated may cause a
    // problem. Thus we return a new sublist.
    if (this.isEmpty()) {
      return [];
    }
    return this.notesArr.slice(this.firstAvailableNoteIndex);
  }

  removeNotesBeforeTime(currentTime) {
    // Internally, hide notes first. Once they've accumulated above a certain
    // threshold, copy the new notes to a new list.
    if (this.isEmpty()) {
      return;
    }

    const horizon = currentTime - canvasTotalTime;
    for (let i = this.firstAvailableNoteIndex; i < this.notesArr.length; i++) {
      const note = this.notesArr[i];
      if (note.visible && note.endTime <= horizon) {
        note.visible = false;
        this.firstAvailableNoteIndex += 1;
        if (this.firstAvailableNoteIndex >= this.notesArr.length) {
          this.firstAvailableNoteIndex = -1;
        }
      } else {
        break;
      }
    }
    // All notes are hidden.
    if (this.firstAvailableNoteIndex === -1) {
      this.notesArr = [];
    }
    // Copy new visible notes.
    if (this.firstAvailableNoteIndex >= 100) {
      this.notesArr = this.notesArr.slice(this.firstAvailableNoteIndex);
      this.firstAvailableNoteIndex = 0;
    }
  }
}

class App {
  constructor(ui, grid, noteQueue, metronome) {
    this.ui = ui;
    this.grid = grid;
    this.inputs;
    this.selectedInput;
    this.noteQ = noteQueue;
    this.metronome = metronome;
    this.isPlaying = false;
    this.grid.registerSyncCallback(() => { metronome.sync(); });
  }

  // onMidiDeviceSelected(selection) {
  //   if (this.selectedInputDevice) {
  //     this.selectedInputDevice.close();
  //   }
  //   const selectedInputDeviceId = selection.target.value;
  //   console.log('Input port', selectedInputDeviceId);
  //   this.selectedInputDevice = this.inputDevicesList.get(selectedInputDeviceId);
  //   this.selectedInputDevice.onmidimessage = this.handleMIDIMessage.bind(this);
  // }
  // handleMIDIMessage(event) {
  //   const [action, keyId, velocity] = event.data;
  //   console.log([action, keyId, velocity]);
  //   if (action === 144) {
  //     // a method to change the body's background color on each key press, not related to Web MIDI
  //   }
  // }

  // Function triggered when WEBMIDI.js is ready
  onMidiReady() {
    console.log("WebMidi ready");
    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
      console.log("No MIDI device detected.");
    } else {
      this.inputs = WebMidi.inputs;
      dbg.inputs = this.inputs;
      dbg.input = this.inputs[0];

      console.log(`Found ${WebMidi.inputs.length} MIDI devices`);
      this.inputs.forEach((device, index) => {
        console.log(`Adding device ${index} ${device.name}`);
        this.ui.appendDeviceOption(index, device.name)
      });

      this.ui.selectDevice(0);
      this.selectDevice(0);

      this.ui.onChange(() => {
        const index = this.ui.getSelectedDeviceIndex();
        console.log("Selected index " + index);
        this.selectDevice(index);
      });
    }
  }

  selectDevice(index) {
    console.log(`Switching to device ${index}`);
    this.input = this.inputs[index];
    this.registerMidiHandler();
  }

  registerMidiHandler() {
    this.inputs.forEach(i => {
      if (i.channels[1].hasListener()) {
        i.channels[1].removeListener();
      }
    });
    this.input.channels[1].addListener("noteon", e => {
      console.log(`Note ${e.note.name} at timestamp ${e.timestamp}`);
      this.noteQ.add(e.note.name, e.timestamp);
      dbg.event = e;
    });
  }

  toggle() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.metronome.start();
      this.grid.start();
    } else {
      this.metronome.stop();
      this.grid.stop();
    }
  }

  sync() {
    this.grid.sync();
    this.metronome.sync();
  }
}

function main() {
  console.log("main");
  const noteQueue = new NoteQueue();
  const ui = new UI();
  const grid = new Grid(noteQueue);
  const metronome = new Metronome();
  const app = new App(ui, grid, noteQueue, metronome);

  metronome.init();
  app.onMidiReady();

  document.getElementById("playButton").onclick = () => {
    app.toggle();
  };
  document.getElementById("sync").onclick = () => {
    app.sync();
  };

  dbg.ui = ui;
  dbg.app = app;
  dbg.grid = grid;
  dbg.noteQ = noteQueue;
}

window.onload = function () {
  WebMidi
    .enable()
    .then(main)
    .catch(err => alert(err));
}