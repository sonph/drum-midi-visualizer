// Debug object for inspecting in the console.
var dbg = {};
const d = document;
const animateForever = true;

// assuming a 4/4 time, 2 measures = 8 beats.
// 9 lines, beginning + 7 separating lines + end line
const tempo = 90;
const msPerBeat = 60 * 1000 / tempo;
const beatsCount = 4;
const canvasTotalTime = msPerBeat * beatsCount; // diff between start and end
// if 8 beats have passed, the new start time is the previous end time.

class Grid {
  constructor() {
    this.cv = document.getElementById("grid");
    if (!this.cv.getContext) {
      alert("Canvas is not supported");
    }
    this.ctx = this.cv.getContext("2d");
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "blue";
    this.cvWidth = this.cv.width;
    this.cvHeight = this.cv.height;

    this.staticCv = document.getElementById("staticGrid");
    this.staticCtx = this.staticCv.getContext("2d");
    this.drawStatic();

    this.calculateCanvasStartEndTime(true);
  }

  get canvasEndTime() {
    return this.canvasStartTime + canvasTotalTime;
  }

  drawStatic() {
    // draw border
    this.staticCtx.lineWidth = 3;
    this.staticCtx.strokeStyle = "black";
    this.staticCtx.strokeRect(0, 0, this.cvWidth, this.cvHeight);

    // draw beat indicator
    const pxBetweenBeats = this.cvWidth / beatsCount;
    for (let i = 1; i < beatsCount; i++) {
      const x = i * pxBetweenBeats;
      this.staticCtx.lineWidth = 1;
      this.staticCtx.beginPath();
      this.staticCtx.moveTo(x, 0);
      this.staticCtx.lineTo(x, this.cvHeight);
      this.staticCtx.stroke();
    }
  }

  draw() {
    this.animate(0);
  }

  animate(timestamp) {
    this.ctx.clearRect(0, 0, this.cvWidth, this.cvHeight);
    this.drawIndicator(timestamp);
    if (!animateForever && performance.now() >= 10 * 1000) {
      return;
    }
    requestAnimationFrame(this.animate.bind(this));
  }

  drawIndicator(timestamp) {
    this.calculateCanvasStartEndTime(false);
    // timestamp: DOMHighResTimeStamp in ms
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters

    const x = (timestamp - this.canvasStartTime) / canvasTotalTime * this.cvWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.cvHeight);
    this.ctx.stroke();
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

class App {
  constructor(ui, grid) {
    this.ui = ui;
    this.grid = grid;
    this.inputs;
    this.selectedInput;
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
      dbg.event = e;
    });
  }
}

function main() {
  console.log("main");
  const ui = new UI();
  const grid = new Grid();
  const app = new App(ui, grid);
  grid.draw();
  app.onMidiReady();
  dbg.ui = ui;
  dbg.app = app;
  dbg.grid = grid;
}

window.onload = function() {
  WebMidi
    .enable()
    .then(main)
    .catch(err => alert(err));
}