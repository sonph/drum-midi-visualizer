WebMidi
  .enable()
  .then(onEnabled)
  .catch(err => alert(err));

// Function triggered when WEBMIDI.js is ready
function onEnabled() {

  // Display available MIDI input devices
  if (WebMidi.inputs.length < 1) {
    document.body.innerHTML += "No device detected.";
  } else {
    WebMidi.inputs.forEach((device, index) => {
      document.body.innerHTML += `${index}: ${device.name} <br>`;
    });
  }

  const mySynth = WebMidi.inputs[0];
  // const mySynth = WebMidi.getInputByName("TYPE NAME HERE!")
  
  mySynth.channels[1].addListener("noteon", e => {
    document.body.innerHTML+= `${e.note.name} <br>`;
  });

  // Listen to 'note on' events on channels 1, 2 and 3 of the first input MIDI device
  // WebMidi.inputs[0].addListener("noteon", e => {
  //   document.body.innerHTML += `${e.note.name} <br>`;
  // }, { channels: [1, 2, 3] });
}