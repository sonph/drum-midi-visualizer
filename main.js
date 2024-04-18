// Debug object for inspecting in the console.
var dbg = {};
const d = document;

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
  constructor(ui) {
    this.ui = ui;
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
  const app = new App(ui);
  app.onMidiReady();
  dbg.ui = ui;
  dbg.app = app;
}

window.onload = function() {
  WebMidi
    .enable()
    .then(main)
    .catch(err => alert(err));
}